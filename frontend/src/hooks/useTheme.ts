import { useEffect, useState } from 'react'

export type Theme = 'dark' | 'light'

function initialTheme(): Theme {
  const stored = localStorage.getItem('finna_theme') as Theme | null
  if (stored === 'dark' || stored === 'light') return stored
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(initialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('finna_theme', theme)
  }, [theme])

  return [theme, setTheme] as const
}
