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

/**
 * Article mis en avant : grande photo et titre côte à côte en grand écran, empilés
 * en mobile. Le texte reste à côté de l'image, jamais posé dessus.
 */
export const FeaturedCard: React.FC<{
  className?: string
  doc?: CardPostData
  showCategories?: boolean
  /** Photo à droite plutôt qu'à gauche */
  reverse?: boolean
  priority?: boolean
  headingLevel?: 'h2' | 'h3'
}> = ({ className, doc, showCategories = true, reverse, priority, headingLevel = 'h2' }) => {
  if (!doc) return null
  const image = imageOf(doc)
  const Heading = headingLevel
  const description = doc.meta?.description?.replace(/\s+/g, ' ').trim()

  return (
    <article
      className={cn('group relative grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-10', className)}
    >
      <div
        className={cn(
          'relative aspect-[3/2] overflow-hidden bg-muted lg:col-span-7',
          reverse && 'lg:order-2',
        )}
      >
        {image ? (
          <Media
            resource={image}
            fill
            priority={priority}
            size="(max-width: 1024px) 100vw, 720px"
          />
        ) : (
          <ImageFallback />
        )}
      </div>
      <div className={cn('lg:col-span-5 lg:pb-2', reverse && 'lg:order-1')}>
        {showCategories && <RubriqueLabel categories={doc.categories} />}
        <Heading className="mt-2 font-serif text-h2 text-balance text-ink">
          <Link href={`/${doc.slug}`} className={titleLinkClass}>
            {doc.title}
          </Link>
        </Heading>
        {description && (
          <p className="mt-4 line-clamp-4 font-serif text-[1.125rem] leading-relaxed text-ink-soft">
            {description}
          </p>
        )}
        <PostDate publishedAt={doc.publishedAt} className="mt-4" />
      </div>
    </article>
  )
}
