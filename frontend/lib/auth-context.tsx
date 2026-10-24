'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export type UserRole = 'GESTOR' | 'EMPRESA'

export interface AuthUser {
  username: string
  role: UserRole
}

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  login: (token: string, user: AuthUser) => void
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  isLoading: true,
})

const TOKEN_KEY = 'antecipe_auth_token'
const USER_KEY = 'antecipe_auth_user'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem(TOKEN_KEY)
      const savedUserStr = localStorage.getItem(USER_KEY)
      if (savedToken && savedUserStr) {
        setToken(savedToken)
        setUser(JSON.parse(savedUserStr))
      }
    } catch {
      // Ignora falhas de parsing de localStorage
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = (newToken: string, newUser: AuthUser) => {
    setToken(newToken)
    setUser(newUser)
    try {
      localStorage.setItem(TOKEN_KEY, newToken)
      localStorage.setItem(USER_KEY, JSON.stringify(newUser))
    } catch {
      // localStorage indisponível
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    try {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    } catch {
      // localStorage indisponível
    }
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      window.location.href = '/'
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
