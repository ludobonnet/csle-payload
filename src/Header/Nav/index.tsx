'use client'

import Link from 'next/link'
import React from 'react'

import type { Header as HeaderType } from '@/payload-types'
import type { Rubrique } from '@/utilities/getRubriques'

import { CMSLink } from '@/components/Link'
import { navLinkClass } from '../navLinkClass'
import { CategoryDropdown } from '../CategoryDropdown'

/** Nombre de rubriques montrées directement ; les suivantes passent dans « Plus ». */
export const RUBRIQUES_EN_TETE = 5

export const HeaderNav: React.FC<{
  data: HeaderType
  rubriques: Rubrique[]
  pathname: string
}> = ({ data, rubriques, pathname }) => {
  const navItems = data?.navItems || []
  const visibles = rubriques.slice(0, RUBRIQUES_EN_TETE)
  const autres = rubriques.slice(RUBRIQUES_EN_TETE)

  return (
    <nav aria-label="Rubriques" className="flex items-stretch gap-7">
      {visibles.map((rubrique) => {
        const href = `/${rubrique.slug}`
        const active = pathname === href
        return (
          <Link
            key={rubrique.id}
            href={href}
            className={navLinkClass(active)}
            aria-current={active ? 'page' : undefined}
          >
            {rubrique.title}
          </Link>
        )
      })}
      {autres.length > 0 && <CategoryDropdown rubriques={autres} pathname={pathname} />}
      {navItems.map(({ link }, i) => (
        <CMSLink key={i} {...link} className={navLinkClass(false)} />
      ))}
    </nav>
  )
}
