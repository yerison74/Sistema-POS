"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { UserManager, type LoginCredentials, type AuthUser } from "@/lib/users"

interface AuthContextType {
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => boolean
  logout: () => void
  user: AuthUser | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    UserManager.initializeDefaultUsers()

    const authStatus = localStorage.getItem("pos-auth")
    const userData = localStorage.getItem("pos-user")

    if (authStatus === "true" && userData) {
      setIsAuthenticated(true)
      setUser(JSON.parse(userData))
    }
  }, [])

  const login = (credentials: LoginCredentials): boolean => {
    const authenticatedUser = UserManager.authenticateUser(credentials)

    if (authenticatedUser) {
      setIsAuthenticated(true)
      setUser(authenticatedUser)
      localStorage.setItem("pos-auth", "true")
      localStorage.setItem("pos-user", JSON.stringify(authenticatedUser))
      return true
    }

    return false
  }

  const logout = () => {
    setIsAuthenticated(false)
    setUser(null)
    localStorage.removeItem("pos-auth")
    localStorage.removeItem("pos-user")
  }

  return <AuthContext.Provider value={{ isAuthenticated, login, logout, user }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
