import Link from 'next/link'
import React from 'react'

import { cn } from '@/utilities/ui'

/** URL d'une page d'archive : la page 1 est l'adresse de base, les suivantes /page/N (comme WordPress). */
export const archivePageHref = (basePath: string, page: number) =>
  page <= 1 ? basePath : `${basePath === '/' ? '' : basePath}/page/${page}`

/** Numéros affichés : la première, la dernière, et la page courante entourée de ses voisines. */
function pagesToShow(page: number, totalPages: number): (number | 'ellipsis')[] {
  const wanted = new Set([1, totalPages, page - 1, page, page + 1])
  const pages = [...wanted].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b)
  return pages.flatMap((n, i) => (i > 0 && n - pages[i - 1] > 1 ? ['ellipsis' as const, n] : [n]))
}

const itemClass =
  'flex h-10 min-w-10 items-center justify-center px-2 font-sans text-[0.9375rem] tabular-nums'

/** Pagination en liens (indexables, utilisables au clavier), sans JavaScript. */
export const Pagination: React.FC<{
  className?: string
  page: number
  totalPages: number
  basePath: string
}> = ({ className, page, totalPages, basePath }) => {
  if (totalPages <= 1) return null

  return (
    <nav aria-label="Pages" className={cn('mt-16 border-t border-line pt-6', className)}>
      <ul className="flex flex-wrap items-center justify-between gap-y-4">
        <li className="min-w-28">
          {page > 1 && (
            <Link
              href={archivePageHref(basePath, page - 1)}
              rel="prev"
              className="font-sans text-[0.9375rem] font-semibold text-ink hover:text-sauge-ink"
            >
              Plus récents
            </Link>
          )}
        </li>
        <li>
          <ul className="flex items-center gap-1">
            {pagesToShow(page, totalPages).map((n, i) =>
              n === 'ellipsis' ? (
                <li key={`e${i}`} className={cn(itemClass, 'text-ink-soft')} aria-hidden="true">
                  …
                </li>
              ) : (
                <li key={n}>
                  {n === page ? (
                    <span
                      aria-current="page"
                      className={cn(itemClass, 'border-t-[0.3125rem] border-sauge font-semibold')}
                    >
                      {n}
                    </span>
                  ) : (
                    <Link
                      href={archivePageHref(basePath, n)}
                      aria-label={`Page ${n}`}
                      className={cn(itemClass, 'text-ink-soft hover:text-sauge-ink')}
                    >
                      {n}
                    </Link>
                  )}
                </li>
              ),
            )}
          </ul>
        </li>
        <li className="min-w-28 text-right">
          {page < totalPages && (
            <Link
              href={archivePageHref(basePath, page + 1)}
              rel="next"
              className="font-sans text-[0.9375rem] font-semibold text-ink hover:text-sauge-ink"
            >
              Plus anciens
            </Link>
          )}
        </li>
      </ul>
    </nav>
  )
}
