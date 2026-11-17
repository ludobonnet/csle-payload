import { cn } from '@/utilities/ui'
import Link from 'next/link'
import React, { Fragment } from 'react'

import type { Post } from '@/payload-types'

export type MinimalCardPostData = Pick<Post, 'slug' | 'categories' | 'title' | 'publishedAt'>

export const MinimalCard: React.FC<{
  className?: string
  doc?: MinimalCardPostData
  showCategories?: boolean
}> = (props) => {
  const { className, doc, showCategories } = props

  const { slug, categories, title, publishedAt } = doc || {}

  const hasCategories = categories && Array.isArray(categories) && categories.length > 0
  const href = `/${slug}`

  // Format date
  const formattedDate = publishedAt
    ? new Date(publishedAt).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  return (
    <article
      className={cn(
        'group relative pl-4 border-l-2 border-primary hover:border-primary-hover transition-colors',
        className,
      )}
    >
      {showCategories && hasCategories && (
        <div className="text-overline uppercase tracking-wider text-primary mb-2">
          {categories?.map((category, index) => {
            if (typeof category === 'object') {
              const { title: categoryTitle } = category
              const isLast = index === categories.length - 1

              return (
                <Fragment key={index}>
                  {categoryTitle || 'Untitled'}
                  {!isLast && <span>, </span>}
                </Fragment>
              )
            }
            return null
          })}
        </div>
      )}

      {title && (
        <h3 className="font-display text-h4 text-foreground group-hover:text-primary transition-colors leading-snug">
          <Link href={href} className="after:absolute after:inset-0 after:content-['']">
            {title}
          </Link>
        </h3>
      )}

      {formattedDate && <p className="text-caption text-muted-foreground mt-2">{formattedDate}</p>}
    </article>
  )
}
