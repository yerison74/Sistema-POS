"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface AuthContextType {
  isAuthenticated: boolean
  login: (password: string) => boolean
  logout: () => void
  user: { name: string; role: string } | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<{ name: string; role: string } | null>(null)

  useEffect(() => {
    const authStatus = localStorage.getItem("pos-auth")
    const userData = localStorage.getItem("pos-user")

    if (authStatus === "true" && userData) {
      setIsAuthenticated(true)
      setUser(JSON.parse(userData))
    }
  }, [])

  const login = (password: string): boolean => {
    const validPasswords = {
      admin123: { name: "Administrador", role: "admin" },
      cajero123: { name: "Cajero", role: "cashier" },
    }

    const userData = validPasswords[password as keyof typeof validPasswords]

    if (userData) {
      setIsAuthenticated(true)
      setUser(userData)
      localStorage.setItem("pos-auth", "true")
      localStorage.setItem("pos-user", JSON.stringify(userData))
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
