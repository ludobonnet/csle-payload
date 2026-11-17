'use client'

import type { Theme } from '@/providers/Theme/types'

import React, { createContext, useCallback, use, useState } from 'react'

export interface ContextType {
  headerTheme?: Theme | null
  setHeaderTheme: (theme: Theme | null) => void
}

const initialContext: ContextType = {
  headerTheme: undefined,
  setHeaderTheme: () => null,
}

const HeaderThemeContext = createContext(initialContext)

export const HeaderThemeProvider = ({ children }: { children: React.ReactNode }) => {
  // Même valeur initiale côté serveur et client (pas de lecture du DOM) : chaque page fixe
  // ensuite son thème d'en-tête après montage, sans écart d'hydratation.
  const [headerTheme, setThemeState] = useState<Theme | undefined | null>(undefined)

  const setHeaderTheme = useCallback((themeToSet: Theme | null) => {
    setThemeState(themeToSet)
  }, [])

  return <HeaderThemeContext value={{ headerTheme, setHeaderTheme }}>{children}</HeaderThemeContext>
}

export const useHeaderTheme = (): ContextType => use(HeaderThemeContext)
