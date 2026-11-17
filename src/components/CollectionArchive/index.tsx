import { cn } from '@/utilities/ui'
import React from 'react'

import { Card, type CardPostData, FeaturedCard } from '@/components/Card'

export type Props = {
  posts: CardPostData[]
  /** Met le premier article en avant (première page d'une archive) */
  lead?: boolean
  className?: string
}

/** Liste d'articles : un éventuel article en tête, puis une grille de trois colonnes. */
export const CollectionArchive: React.FC<Props> = ({ posts, lead = false, className }) => {
  const docs = (posts ?? []).filter((post) => typeof post === 'object' && post !== null)
  const [first, ...rest] = docs
  const grid = lead ? rest : docs

  return (
    <div className={cn('container', className)}>
      {lead && first && (
        <FeaturedCard doc={first} priority className="mb-14 border-b border-line pb-14" />
      )}
      {grid.length > 0 && (
        <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {grid.map((post, index) => (
            <Card key={post.slug ?? index} doc={post} />
          ))}
        </div>
      )}
    </div>
  )
}
