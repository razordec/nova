'use client'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { useEffect, useState } from 'react'
import { useUIStore } from '@/stores/ui-store'

export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  const [mounted, setMounted] = useState(false)
  const theme = useUIStore((s) => s.theme)

  useEffect(() => {
    useUIStore.persist.setKey('theme') // persist if desired
    setMounted(true)
  }, [])

  if (!mounted) return <>{children}</>

  return <NextThemesProvider {...props} defaultTheme={theme}>{children}</NextThemesProvider>
}