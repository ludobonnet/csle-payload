'use client'
import React, { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { SearchIcon } from 'lucide-react'

import { useDebounce } from '@/utilities/useDebounce'

/**
 * Champ de recherche : part du terme présent dans l'URL et la met à jour pendant la frappe
 * (remplacement d'historique, pour ne pas empiler une entrée par lettre).
 */
export const Search: React.FC = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const current = searchParams.get('q') ?? ''
  const [value, setValue] = useState(current)
  const debouncedValue = useDebounce(value.trim())

  useEffect(() => {
    if (debouncedValue === current) return
    router.replace(
      debouncedValue ? `${pathname}?q=${encodeURIComponent(debouncedValue)}` : pathname,
      {
        scroll: false,
      },
    )
  }, [debouncedValue, current, pathname, router])

  return (
    <form role="search" onSubmit={(event) => event.preventDefault()} className="mt-10 max-w-2xl">
      <label htmlFor="search" className="sr-only">
        Rechercher un article
      </label>
      <div className="flex items-center gap-3 border-b-2 border-ink pb-2 focus-within:border-sauge">
        <SearchIcon
          className="size-6 shrink-0 text-ink-soft"
          strokeWidth={1.75}
          aria-hidden="true"
        />
        <input
          id="search"
          type="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Un lieu, un artiste, un livre…"
          autoComplete="off"
          className="w-full bg-transparent font-serif text-h3 text-ink placeholder:text-ink-soft/70 focus:outline-none"
        />
      </div>
    </form>
  )
}
