'use client'

import React, { useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'

import type { Rubrique } from '@/utilities/getRubriques'
import { cn } from '@/utilities/ui'
import { navLinkClass } from './navLinkClass'

/** Menu « Plus » : les rubriques qui ne tiennent pas dans l'en-tête. Clic ou clavier, pas de survol. */
export const CategoryDropdown: React.FC<{ rubriques: Rubrique[]; pathname: string }> = ({
  rubriques,
  pathname,
}) => {
  // Ouvert « pour » une page donnée : se referme de lui-même au changement de route
  const [openPath, setOpenPath] = useState<string | null>(null)
  const isOpen = openPath === pathname
  const ref = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const active = rubriques.some((rubrique) => `/${rubrique.slug}` === pathname)

  useEffect(() => {
    if (!isOpen) return
    const onPointer = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpenPath(null)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenPath(null)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [isOpen])

  return (
    <div className="relative flex" ref={ref}>
      <button
        type="button"
        onClick={() => setOpenPath(isOpen ? null : pathname)}
        className={cn(navLinkClass(active), 'gap-1')}
        aria-expanded={isOpen}
        aria-controls={menuId}
      >
        Plus
        <ChevronDown
          className={cn('size-4 transition-transform duration-200', isOpen && 'rotate-180')}
          strokeWidth={2}
        />
      </button>

      {isOpen && (
        <ul
          id={menuId}
          className="absolute right-0 top-full z-50 min-w-52 border border-line border-t-[0.3125rem] border-t-sauge bg-paper py-2 shadow-[0_12px_32px_-12px_rgb(42_36_32/0.25)]"
        >
          {rubriques.map((rubrique) => {
            const href = `/${rubrique.slug}`
            const current = pathname === href
            return (
              <li key={rubrique.id}>
                <Link
                  href={href}
                  aria-current={current ? 'page' : undefined}
                  className={cn(
                    'flex items-baseline justify-between gap-6 px-4 py-2 font-sans text-[0.9375rem] transition-colors hover:bg-wash',
                    current ? 'font-semibold text-sauge-ink' : 'text-ink',
                  )}
                >
                  {rubrique.title}
                  <span className="meta tabular-nums">{rubrique.count}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
