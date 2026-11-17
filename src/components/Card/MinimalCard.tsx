import { cn } from '@/utilities/ui'
import Link from 'next/link'
import React from 'react'

import { Media } from '@/components/Media'
import { type CardPostData, imageOf, PostDate, RubriqueLabel, titleLinkClass } from './shared'

/** Ligne de sommaire : petite vignette, rubrique, titre, date. */
export const MinimalCard: React.FC<{
  className?: string
  doc?: CardPostData
  showCategories?: boolean
}> = ({ className, doc, showCategories = false }) => {
  if (!doc) return null
  const image = imageOf(doc)

  return (
    <article className={cn('group relative flex items-start gap-4', className)}>
      {image && (
        <div className="relative aspect-[4/3] w-28 shrink-0 overflow-hidden bg-muted md:w-32">
          <Media resource={image} fill size="128px" />
        </div>
      )}
      <div className="min-w-0">
        {showCategories && <RubriqueLabel categories={doc.categories} className="mb-1" />}
        <h3 className="font-serif text-[1.1875rem] leading-snug text-pretty text-ink">
          <Link href={`/${doc.slug}`} className={titleLinkClass}>
            {doc.title}
          </Link>
        </h3>
        <PostDate publishedAt={doc.publishedAt} className="mt-1.5" />
      </div>
    </article>
  )
}
