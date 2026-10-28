import { useEffect, useState, type PropsWithChildren } from 'react'

import { ThemeContext, type ResolvedTheme, type ThemePreference } from './theme-context'

// Must match the inline anti-flash script in index.html.
const STORAGE_KEY = 'arda-theme-preference'
const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)'

function readStoredPreference(): ThemePreference {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'
}

function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === 'system') {
    return window.matchMedia(DARK_MEDIA_QUERY).matches ? 'dark' : 'light'
  }
  return preference
}

function applyTheme(resolved: ResolvedTheme): void {
  document.documentElement.classList.toggle('dark', resolved === 'dark')
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => readStoredPreference())
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    const resolved = resolveTheme(preference)
    applyTheme(resolved)
    return resolved
  })

  // Only "system" needs an ongoing subscription — the OS theme can change
  // without any action here. Explicit light/dark choices are applied
  // directly in `setPreference` below, no effect involved.
  useEffect(() => {
    if (preference !== 'system') return

    const media = window.matchMedia(DARK_MEDIA_QUERY)
    const handleChange = () => {
      const next = resolveTheme('system')
      setResolvedTheme(next)
      applyTheme(next)
    }
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [preference])

  function setPreference(next: ThemePreference) {
    localStorage.setItem(STORAGE_KEY, next)
    setPreferenceState(next)
    const resolved = resolveTheme(next)
    setResolvedTheme(resolved)
    applyTheme(resolved)
  }

  return (
    <ThemeContext.Provider value={{ preference, resolvedTheme, setPreference }}>{children}</ThemeContext.Provider>
  )
}
