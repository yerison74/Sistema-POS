export interface User {
  id: string
  username: string
  password: string
  role: "admin" | "cashier"
  name: string
  email?: string
  createdAt: number
  lastLogin?: number
  isActive: boolean
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface AuthUser {
  id: string
  username: string
  role: "admin" | "cashier"
  name: string
}

export class UserManager {
  private static readonly STORAGE_KEY = "pos_users"

  static initializeDefaultUsers(): void {
    const existingUsers = this.getUsers()
    if (existingUsers.length === 0) {
      // Crear usuario administrador por defecto
      const adminUser: User = {
        id: "admin-001",
        username: "admin",
        password: "admin123",
        role: "admin",
        name: "Administrador",
        email: "admin@negocio.com",
        createdAt: Date.now(),
        isActive: true,
      }

      // Crear usuario cajero por defecto
      const cashierUser: User = {
        id: "cashier-001",
        username: "cajero",
        password: "cajero123",
        role: "cashier",
        name: "Cajero Principal",
        createdAt: Date.now(),
        isActive: true,
      }

      this.saveUsers([adminUser, cashierUser])
    }
  }

  static getUsers(): User[] {
    try {
      const users = localStorage.getItem(this.STORAGE_KEY)
      return users ? JSON.parse(users) : []
    } catch (error) {
      console.error("Error loading users:", error)
      return []
    }
  }

  static saveUsers(users: User[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users))
    } catch (error) {
      console.error("Error saving users:", error)
    }
  }

  static authenticateUser(credentials: LoginCredentials): AuthUser | null {
    const users = this.getUsers()
    const user = users.find(
      (u) => u.username === credentials.username && u.password === credentials.password && u.isActive,
    )

    if (user) {
      // Actualizar último login
      user.lastLogin = Date.now()
      this.saveUsers(users)

      return {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
      }
    }

    return null
  }

  static createUser(userData: Omit<User, "id" | "createdAt">): User {
    const users = this.getUsers()

    // Verificar que el username no exista
    if (users.some((u) => u.username === userData.username)) {
      throw new Error("El nombre de usuario ya existe")
    }

    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
      createdAt: Date.now(),
    }

    users.push(newUser)
    this.saveUsers(users)

    return newUser
  }

  static updateUser(userId: string, updates: Partial<Omit<User, "id" | "createdAt">>): User {
    const users = this.getUsers()
    const userIndex = users.findIndex((u) => u.id === userId)

    if (userIndex === -1) {
      throw new Error("Usuario no encontrado")
    }

    // Si se está actualizando el username, verificar que no exista
    if (updates.username && updates.username !== users[userIndex].username) {
      if (users.some((u) => u.username === updates.username && u.id !== userId)) {
        throw new Error("El nombre de usuario ya existe")
      }
    }

    users[userIndex] = { ...users[userIndex], ...updates }
    this.saveUsers(users)

    return users[userIndex]
  }

  static deleteUser(userId: string): void {
    const users = this.getUsers()
    const userToDelete = users.find((u) => u.id === userId)

    if (!userToDelete) {
      throw new Error("Usuario no encontrado")
    }

    if (userToDelete.role === "admin") {
      const adminCount = users.filter((u) => u.role === "admin" && u.isActive).length
      if (adminCount <= 1) {
        throw new Error("No se puede eliminar el último administrador")
      }
    }

    const filteredUsers = users.filter((u) => u.id !== userId)
    this.saveUsers(filteredUsers)
  }

  static toggleUserStatus(userId: string): User {
    const users = this.getUsers()
    const userIndex = users.findIndex((u) => u.id === userId)

    if (userIndex === -1) {
      throw new Error("Usuario no encontrado")
    }

    const user = users[userIndex]

    // No permitir desactivar el último admin activo
    if (user.role === "admin" && user.isActive) {
      const activeAdminCount = users.filter((u) => u.role === "admin" && u.isActive).length
      if (activeAdminCount <= 1) {
        throw new Error("No se puede desactivar el último administrador")
      }
    }

    users[userIndex].isActive = !users[userIndex].isActive
    this.saveUsers(users)

    return users[userIndex]
  }

  static changePassword(userId: string, newPassword: string): void {
    const users = this.getUsers()
    const userIndex = users.findIndex((u) => u.id === userId)

    if (userIndex === -1) {
      throw new Error("Usuario no encontrado")
    }

    users[userIndex].password = newPassword
    this.saveUsers(users)
  }

  static getUserById(userId: string): User | null {
    const users = this.getUsers()
    return users.find((u) => u.id === userId) || null
  }

  static getUserByUsername(username: string): User | null {
    const users = this.getUsers()
    return users.find((u) => u.username === username) || null
  }

  static getActiveUsers(): User[] {
    return this.getUsers().filter((u) => u.isActive)
  }

  static getUsersByRole(role: "admin" | "cashier"): User[] {
    return this.getUsers().filter((u) => u.role === role && u.isActive)
  }
}
