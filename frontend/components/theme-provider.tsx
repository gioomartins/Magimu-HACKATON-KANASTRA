'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes'

export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      storageKey="antecipe-theme"
      {...props}
    >
      <ThemeColorSync />
      {children}
    </NextThemesProvider>
  )
}

function ThemeColorSync() {
  const { resolvedTheme } = useTheme()

  React.useEffect(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', resolvedTheme === 'dark' ? '#0B2C20' : '#F8F6F1')
    }
  }, [resolvedTheme])

  return null
}
