'use client'

import React, { useState, useSyncExternalStore } from 'react'

import { cn } from '@/utilities/ui'
import { useTheme } from '..'
import { themeLocalStorageKey } from './types'

const subscribeToStorage = (onChange: () => void) => {
  window.addEventListener('storage', onChange)
  return () => window.removeEventListener('storage', onChange)
}

const OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: 'light', label: 'Clair' },
  { value: 'dark', label: 'Sombre' },
] as const

type Choice = (typeof OPTIONS)[number]['value']

/** Choix du thème : trois boutons, l'option active est soulignée du filet sauge. */
export const ThemeSelector: React.FC = () => {
  const { setTheme } = useTheme()
  // Choix fait dans cette session ; à défaut, la préférence enregistrée (lue côté client seulement)
  const [chosen, setValue] = useState<Choice | null>(null)
  const stored = useSyncExternalStore(
    subscribeToStorage,
    () => (window.localStorage.getItem(themeLocalStorageKey) as Choice | null) ?? 'auto',
    () => null,
  )
  const value = chosen ?? stored

  const choose = (next: Choice) => {
    setTheme(next === 'auto' ? null : next)
    setValue(next)
  }

  return (
    <div role="group" aria-label="Thème d'affichage" className="flex gap-4 font-sans text-caption">
      {OPTIONS.map((option) => {
        const pressed = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={pressed}
            onClick={() => choose(option.value)}
            className={cn(
              'border-b-[3px] pb-0.5 transition-colors',
              pressed
                ? 'border-sauge font-semibold text-current'
                : 'border-transparent opacity-75 hover:opacity-100',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
