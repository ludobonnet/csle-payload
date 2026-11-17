'use client'

import React, { createContext, useCallback, useEffect, use, useState } from 'react'

import type { Theme, ThemeContextType } from './types'

import canUseDOM from '@/utilities/canUseDOM'
import { getImplicitPreference, themeLocalStorageKey } from './shared'

const initialContext: ThemeContextType = {
  setTheme: () => null,
  theme: undefined,
}

const ThemeContext = createContext(initialContext)

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<Theme | undefined>(
    canUseDOM ? (document.documentElement.getAttribute('data-theme') as Theme) : undefined,
  )

  const setTheme = useCallback((themeToSet: Theme | null) => {
    if (themeToSet === null) {
      window.localStorage.removeItem(themeLocalStorageKey)
      const implicitPreference = getImplicitPreference()
      document.documentElement.setAttribute('data-theme', implicitPreference || '')
      if (implicitPreference) setThemeState(implicitPreference)
    } else {
      setThemeState(themeToSet)
      window.localStorage.setItem(themeLocalStorageKey, themeToSet)
      document.documentElement.setAttribute('data-theme', themeToSet)
    }
  }, [])

  // InitTheme pose data-theme avant le premier rendu et l'état initial le relit. Mais quand
  // React re-rend la racine côté client (page 404), l'attribut disparaît et la page restait
  // à opacité 0 : on le repose au montage s'il manque (écriture DOM seule, pas d'état).
  useEffect(() => {
    const root = document.documentElement
    if (root.getAttribute('data-theme')) return
    const stored = window.localStorage.getItem(themeLocalStorageKey)
    const restored =
      stored === 'light' || stored === 'dark' ? stored : getImplicitPreference() || 'light'
    root.setAttribute('data-theme', restored)
  }, [])

  return <ThemeContext value={{ setTheme, theme }}>{children}</ThemeContext>
}

export const useTheme = (): ThemeContextType => use(ThemeContext)
