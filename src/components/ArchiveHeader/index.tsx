import React from 'react'

import { cn } from '@/utilities/ui'

/**
 * En-tête de liste (rubrique, tous les articles, recherche) : grand titre sous le filet,
 * une ligne de contexte, et un emplacement libre (champ de recherche).
 */
export const ArchiveHeader: React.FC<{
  title: string
  context?: React.ReactNode
  children?: React.ReactNode
  className?: string
}> = ({ title, context, children, className }) => (
  <header className={cn('container pb-12 pt-12 md:pb-16 md:pt-20', className)}>
    <h1 className="filet font-serif text-display text-ink">{title}</h1>
    {context && <p className="meta mt-5 text-[0.9375rem]">{context}</p>}
    {children}
  </header>
)

/** « 301 articles », « Articles 13 à 24 sur 301 » */
export const archiveContext = ({
  page,
  limit,
  totalDocs,
}: {
  page: number
  limit: number
  totalDocs: number
}): string => {
  const total = totalDocs.toLocaleString('fr-FR')
  if (totalDocs === 0) return 'Aucun article pour le moment.'
  if (totalDocs === 1) return '1 article.'
  if (page <= 1) return `${total} articles, du plus récent au plus ancien.`
  const start = (page - 1) * limit + 1
  const end = Math.min(page * limit, totalDocs)
  return `Articles ${start} à ${end} sur ${total}.`
}
