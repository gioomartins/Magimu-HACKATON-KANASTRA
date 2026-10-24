'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon, Laptop } from 'lucide-react'

interface ThemeToggleProps {
  className?: string
  variant?: 'subtle' | 'outline' | 'pill'
}

export function ThemeToggle({ className = '', variant = 'pill' }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-950/20 text-emerald-300/40 ${className}`}
        aria-hidden="true"
      >
        <span className="size-4 animate-pulse rounded-full bg-emerald-500/20" />
      </div>
    )
  }

  const isDark = resolvedTheme === 'dark'

  const toggleTheme = () => {
    // Adiciona classe de transição suave temporariamente
    document.documentElement.classList.add('theme-transition')
    setTheme(isDark ? 'light' : 'dark')
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transition')
    }, 250)
  }

  const ariaLabel = isDark ? 'Ativar tema claro' : 'Ativar tema escuro'
  const tooltipText = isDark ? 'Alternar para tema claro' : 'Alternar para tema escuro'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={ariaLabel}
      title={tooltipText}
      role="switch"
      aria-checked={isDark}
      className={`group relative flex h-11 min-h-[44px] w-11 min-w-[44px] items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-950/30 text-emerald-200 transition-all duration-200 hover:border-emerald-400/50 hover:bg-emerald-900/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b2c20] dark:border-emerald-500/20 dark:bg-[#103b2c] dark:text-emerald-300 dark:hover:bg-[#164c39] ${className}`}
    >
      <span className="sr-only">{ariaLabel}</span>
      {isDark ? (
        <Sun className="size-5 transition-transform duration-200 group-hover:rotate-45 text-amber-300" />
      ) : (
        <Moon className="size-5 transition-transform duration-200 group-hover:-rotate-12 text-emerald-700 dark:text-emerald-300" />
      )}
    </button>
  )
}
