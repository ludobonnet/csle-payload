'use client'

import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'

import type { Header as HeaderType } from '@/payload-types'
import type { Rubrique } from '@/utilities/getRubriques'
import { CMSLink } from '@/components/Link'
import { cn } from '@/utilities/ui'

interface MobileMenuProps {
  data: HeaderType
  rubriques: Rubrique[]
  pathname: string
  isOpen: boolean
  onToggle: () => void
}

/**
 * Menu mobile : un panneau plein écran sous l'en-tête, qui liste toutes les rubriques
 * en grand, comme un sommaire de magazine.
 */
export const MobileMenu: React.FC<MobileMenuProps> = ({
  data,
  rubriques,
  pathname,
  isOpen,
  onToggle,
}) => {
  const navItems = data?.navItems || []

  // Page figée derrière le panneau ; Échap referme
  useEffect(() => {
    if (!isOpen) return
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onToggle()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKey)
    }
  }, [isOpen, onToggle])

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        className="-mr-2 flex h-10 items-center gap-2 px-2 font-sans font-condensed text-[0.9375rem] font-semibold text-ink"
        aria-expanded={isOpen}
        aria-controls="menu-mobile"
      >
        {isOpen ? 'Fermer' : 'Menu'}
        <span aria-hidden="true" className="relative block h-3 w-5">
          <span
            className={cn(
              'absolute left-0 h-0.5 w-5 bg-current transition-transform duration-200',
              isOpen ? 'top-[5px] rotate-45' : 'top-0',
            )}
          />
          <span
            className={cn(
              'absolute left-0 h-0.5 w-5 bg-current transition-transform duration-200',
              isOpen ? 'top-[5px] -rotate-45' : 'top-[10px]',
            )}
          />
        </span>
      </button>

      {/* Portail sur body : le backdrop-filter de l'en-tête enfermerait un enfant `fixed` dans ses 64px */}
      {isOpen &&
        createPortal(
          <div
            id="menu-mobile"
            className="fixed inset-x-0 bottom-0 top-16 z-30 overflow-y-auto bg-paper animate-in fade-in duration-200"
          >
            <nav aria-label="Rubriques" className="container py-8">
              <p className="filet font-sans font-condensed text-[0.9375rem] font-semibold text-ink">
                Rubriques
              </p>
              <ul className="mt-6 divide-y divide-line border-y border-line">
                {rubriques.map((rubrique) => {
                  const href = `/${rubrique.slug}`
                  const current = pathname === href
                  return (
                    <li key={rubrique.id}>
                      <Link
                        href={href}
                        onClick={onToggle}
                        aria-current={current ? 'page' : undefined}
                        className={cn(
                          'flex items-baseline justify-between py-3 font-serif text-[1.75rem] leading-tight',
                          current ? 'text-sauge-ink' : 'text-ink',
                        )}
                      >
                        {rubrique.title}
                        <span className="meta tabular-nums">{rubrique.count}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>

              <ul className="mt-8 flex flex-col gap-3 font-sans text-body">
                {navItems.map(({ link }, i) => (
                  <li key={i} onClick={onToggle}>
                    <CMSLink {...link} className="text-ink hover:text-sauge-ink" />
                  </li>
                ))}
                <li>
                  <Link href="/search" onClick={onToggle} className="text-ink hover:text-sauge-ink">
                    Rechercher un article
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    onClick={onToggle}
                    className="text-ink hover:text-sauge-ink"
                  >
                    Nous écrire
                  </Link>
                </li>
              </ul>
            </nav>
          </div>,
          document.body,
        )}
    </>
  )
}
