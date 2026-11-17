import type { Metadata } from 'next'

import { cn } from '@/utilities/ui'
import localFont from 'next/font/local'
import React from 'react'
import Script from 'next/script'

// Polices auto-hébergées depuis npm (Fontsource) : aucun appel à Google, ni au build ni chez le visiteur.
// Sous-ensemble latin (couvre le français, œ compris), fontes variables. Chemins littéraux : next/font les lit au build.
// Serif éditoriale pour les titres
const playfair = localFont({
  src: [
    {
      path: '../../../node_modules/@fontsource-variable/playfair-display/files/playfair-display-latin-wght-normal.woff2',
      style: 'normal',
    },
    {
      path: '../../../node_modules/@fontsource-variable/playfair-display/files/playfair-display-latin-wght-italic.woff2',
      style: 'italic',
    },
  ],
  weight: '400 900',
  variable: '--font-playfair',
  display: 'swap',
})

// Sans-serif lisible pour le texte
const inter = localFont({
  src: [
    {
      path: '../../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2',
      style: 'normal',
    },
    {
      path: '../../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-italic.woff2',
      style: 'italic',
    },
  ],
  weight: '100 900',
  variable: '--font-inter',
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
    <html className={cn(playfair.variable, inter.variable)} lang="fr" suppressHydrationWarning>
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
          {children}
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
