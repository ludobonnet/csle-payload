import type { Metadata } from 'next'

import { cn } from '@/utilities/ui'
import localFont from 'next/font/local'
import React from 'react'
import Script from 'next/script'

// Polices auto-hébergées depuis npm (Fontsource) : aucun appel à Google, ni au build ni chez le visiteur.
// Sous-ensemble latin (couvre le français, œ compris). Fichiers « standard » : tous les axes variables.
// Chemins littéraux : next/font les lit au build.

// Newsreader : serif éditoriale à tailles optiques (opsz 6–72), titres et texte des articles
const newsreader = localFont({
  src: [
    {
      path: '../../../node_modules/@fontsource-variable/newsreader/files/newsreader-latin-standard-normal.woff2',
      style: 'normal',
    },
    {
      path: '../../../node_modules/@fontsource-variable/newsreader/files/newsreader-latin-standard-italic.woff2',
      style: 'italic',
    },
  ],
  weight: '200 800',
  variable: '--font-newsreader',
  display: 'swap',
})

// Archivo : grotesque à largeur variable (wdth 62–125), interface, navigation, métadonnées
const archivo = localFont({
  src: [
    {
      path: '../../../node_modules/@fontsource-variable/archivo/files/archivo-latin-standard-normal.woff2',
      style: 'normal',
    },
  ],
  weight: '100 900',
  // Plage de largeur déclarée pour que `font-stretch` (utilitaire .font-condensed) pilote l'axe wdth
  declarations: [{ prop: 'font-stretch', value: '62% 125%' }],
  variable: '--font-archivo',
  display: 'swap',
})

import { AdminBar } from '@/components/AdminBar'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { draftMode } from 'next/headers'

import './globals.css'
import { getServerSideURL } from '@/utilities/getURL'
import { pageTitle, SITE_DESCRIPTION, UMAMI } from '@/utilities/site'

// Tout le site public est rendu à la requête (trafic faible, Cloudflare devant) :
// le build ne touche jamais la base, et aucune page n'est figée sans ses données
// (sans cette ligne, la 404 était prérendue sans en-tête quand la base manquait).
export const dynamic = 'force-dynamic'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled } = await draftMode()

  return (
    <html className={cn(newsreader.variable, archivo.variable)} lang="fr" suppressHydrationWarning>
      <head>
        <InitTheme />
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
        <Script
          defer
          src={UMAMI.scriptUrl}
          data-website-id={UMAMI.websiteId}
          data-domains={UMAMI.domains}
          data-do-not-track="true"
        />
      </head>
      <body>
        <Providers>
          <AdminBar
            adminBarProps={{
              preview: isEnabled,
            }}
          />

          <Header />
          <main id="contenu" className="flex-1">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  openGraph: mergeOpenGraph(),
  title: pageTitle(),
  description: SITE_DESCRIPTION,
  twitter: {
    card: 'summary_large_image',
  },
}
