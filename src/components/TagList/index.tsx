import Link from 'next/link'
import React from 'react'

import type { Tag } from '@/payload-types'
import { cn } from '@/utilities/ui'

type Props = {
  tags: (Tag | number)[]
  className?: string
}

/** Mots-clés de l'article, chacun menant à sa page /tag/… (forme WordPress). */
export function TagList({ tags, className }: Props) {
  const populatedTags = tags.filter((tag): tag is Tag => typeof tag === 'object' && !!tag.slug)

  if (populatedTags.length === 0) {
    return null
  }

  return (
    <p className={cn('meta', className)}>
      <span className="font-semibold text-ink">Mots-clés : </span>
      {populatedTags.map((tag, index) => (
        <React.Fragment key={tag.id}>
          {index > 0 && ', '}
          <Link href={`/tag/${tag.slug}`} className="lien">
            {tag.title}
          </Link>
        </React.Fragment>
      ))}
    </p>
  )
}
