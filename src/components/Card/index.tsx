import { cn } from '@/utilities/ui'
import Link from 'next/link'
import React from 'react'

import { Media } from '@/components/Media'
import {
  type CardPostData,
  ImageFallback,
  imageOf,
  PostDate,
  RubriqueLabel,
  titleLinkClass,
} from './shared'

export type { CardPostData } from './shared'

/** Carte standard : photo 3:2, rubrique, titre, date. Toute la carte mène à l'article. */
export const Card: React.FC<{
  className?: string
  doc?: CardPostData
  showCategories?: boolean
  title?: string
  /** Attribut `sizes` de la photo */
  size?: string
  /** Titre plus grand, pour une carte qui ouvre une section */
  large?: boolean
}> = ({ className, doc, showCategories = true, title: titleFromProps, size, large }) => {
  if (!doc) return null
  const image = imageOf(doc)
  const title = titleFromProps || doc.title

  return (
    <article className={cn('group relative flex flex-col', className)}>
      <div className="relative aspect-[3/2] w-full overflow-hidden bg-muted">
        {image ? (
          <Media
            resource={image}
            fill
            size={size ?? '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px'}
          />
        ) : (
          <ImageFallback />
        )}
      </div>
      {showCategories && <RubriqueLabel categories={doc.categories} className="mt-4" />}
      <h3
        className={cn('font-serif text-pretty text-ink', large ? 'mt-3 text-h3' : 'mt-1.5 text-h4')}
      >
        <Link href={`/${doc.slug}`} className={titleLinkClass}>
          {title}
        </Link>
      </h3>
      <PostDate publishedAt={doc.publishedAt} className="mt-2" />
    </article>
  )
}

export { FeaturedCard } from './FeaturedCard'
export { MinimalCard } from './MinimalCard'
