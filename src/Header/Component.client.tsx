'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useCallback, useState } from 'react'
import { SearchIcon } from 'lucide-react'

import type { Header } from '@/payload-types'
import type { Rubrique } from '@/utilities/getRubriques'

import { Logo } from '@/components/Logo/Logo'
import { HeaderNav } from './Nav'
import { MobileMenu } from './MobileMenu'

interface HeaderClientProps {
  data: Header
  rubriques: Rubrique[]
}

/**
 * En-tête collant, une seule ligne : logo, rubriques, recherche. Pas de calcul au défilement :
 * `position: sticky` suffit et ne fait pas sauter la page.
 */
export const HeaderClient: React.FC<HeaderClientProps> = ({ data, rubriques }) => {
  const pathname = usePathname()
  // Menu mobile ouvert « pour » une page donnée : il se referme de lui-même au changement de route
  const [mobileMenuPath, setMobileMenuPath] = useState<string | null>(null)
  const isMobileMenuOpen = mobileMenuPath === pathname

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuPath((open) => (open === pathname ? null : pathname))
  }, [pathname])

  return (
    <header className="sticky top-0 z-40 w-full border-b border-line bg-paper/92 backdrop-blur-md supports-[backdrop-filter]:bg-paper/85">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:bg-paper focus:px-3 focus:py-2"
      >
        Aller au contenu
      </a>
      <div className="container flex h-16 items-center justify-between gap-8 lg:h-[4.5rem]">
        <Link href="/" className="shrink-0 py-2" aria-label="csle, retour à l'accueil">
          <Logo className="h-7 lg:h-8" title="csle" />
        </Link>

        <div className="hidden lg:flex lg:items-stretch lg:self-stretch lg:gap-8">
          <HeaderNav data={data} rubriques={rubriques} pathname={pathname} />
          <Link
            href="/search"
            className="flex items-center text-ink hover:text-sauge-ink transition-colors"
            aria-label="Rechercher"
          >
            <SearchIcon className="size-5" strokeWidth={1.75} />
          </Link>
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          <Link
            href="/search"
            className="p-2 text-ink hover:text-sauge-ink transition-colors"
            aria-label="Rechercher"
          >
            <SearchIcon className="size-5" strokeWidth={1.75} />
          </Link>
          <MobileMenu
            data={data}
            rubriques={rubriques}
            pathname={pathname}
            isOpen={isMobileMenuOpen}
            onToggle={toggleMobileMenu}
          />
        </div>
      </div>
    </header>
  )
}
