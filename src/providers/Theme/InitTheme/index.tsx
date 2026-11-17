import React from 'react'

import { defaultTheme, themeLocalStorageKey } from '../ThemeSelector/types'

/**
 * Pose data-theme sur <html> avant le premier rendu (pas de flash de thème). Script en ligne
 * ordinaire, rendu par le serveur dans <head> : exécuté à la lecture du HTML, y compris sur
 * la 404, où un next/script « beforeInteractive » ne s'exécutait pas (page restée blanche).
 */
export const InitTheme: React.FC = () => {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
  (function () {
    function getImplicitPreference() {
      var mediaQuery = '(prefers-color-scheme: dark)'
      var mql = window.matchMedia(mediaQuery)
      var hasImplicitPreference = typeof mql.matches === 'boolean'

      if (hasImplicitPreference) {
        return mql.matches ? 'dark' : 'light'
      }

      return null
    }

    function themeIsValid(theme) {
      return theme === 'light' || theme === 'dark'
    }

    var themeToSet = '${defaultTheme}'
    var preference = window.localStorage.getItem('${themeLocalStorageKey}')

    if (themeIsValid(preference)) {
      themeToSet = preference
    } else {
      var implicitPreference = getImplicitPreference()

      if (implicitPreference) {
        themeToSet = implicitPreference
      }
    }

    document.documentElement.setAttribute('data-theme', themeToSet)
  })();
  `,
      }}
      id="theme-script"
    />
  )
}
