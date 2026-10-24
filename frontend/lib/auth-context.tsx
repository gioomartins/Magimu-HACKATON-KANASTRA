'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export type UserRole = 'GESTOR' | 'EMPRESA'

export interface AuthUser {
  username: string
  role: UserRole
  nome?: string
  cnpj?: string
}

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  isDemo: boolean
  login: (token: string, user: AuthUser) => void
  loginDemo: (user: AuthUser) => void
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isDemo: false,
  login: () => {},
  loginDemo: () => {},
  logout: () => {},
  isLoading: true,
})

const TOKEN_KEY = 'antecipe_auth_token'
const USER_KEY = 'antecipe_auth_user'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isDemo, setIsDemo] = useState(false)
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
    setIsDemo(false)
    setToken(newToken)
    setUser(newUser)
    try {
      localStorage.setItem(TOKEN_KEY, newToken)
      localStorage.setItem(USER_KEY, JSON.stringify(newUser))
    } catch {
      // localStorage indisponível
    }
  }

  // Login de Demonstração em memória: sem persistência em localStorage ou cookies
  const loginDemo = (demoUser: AuthUser) => {
    setIsDemo(true)
    setToken('demo-token-in-memory')
    setUser(demoUser)
  }

  const logout = () => {
    setIsDemo(false)
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
    <AuthContext.Provider value={{ user, token, isDemo, login, loginDemo, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
