'use client'
import { cn } from '@/utilities/ui'
import useClickableCard from '@/utilities/useClickableCard'
import Link from 'next/link'
import React, { Fragment } from 'react'

import type { Post } from '@/payload-types'

import { Media } from '@/components/Media'

export type CardPostData = Pick<Post, 'slug' | 'categories' | 'meta' | 'title' | 'heroImage' | 'publishedAt'>

export const Card: React.FC<{
  alignItems?: 'center'
  className?: string
  doc?: CardPostData
  showCategories?: boolean
  title?: string
}> = (props) => {
  const { card, link } = useClickableCard({})
  const { className, doc, showCategories, title: titleFromProps } = props

  const { slug, categories, meta, title, heroImage, publishedAt } = doc || {}
  const { description, image: metaImage } = meta || {}
  const displayImage = heroImage || metaImage

  const hasCategories = categories && Array.isArray(categories) && categories.length > 0
  const titleToUse = titleFromProps || title
  const sanitizedDescription = description?.replace(/\s/g, ' ')
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
        'group overflow-hidden bg-card hover:cursor-pointer transition-all duration-300',
        className,
      )}
      ref={card.ref}
    >
      {/* Image container with 4:3 aspect ratio */}
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-muted">
        {displayImage && typeof displayImage !== 'string' ? (
          <Media
            resource={displayImage}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-caption">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-30"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="py-4">
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

        {titleToUse && (
          <h3 className="font-display text-h4 text-foreground group-hover:text-primary transition-colors leading-snug mb-2">
            <Link href={href} ref={link.ref}>
              {titleToUse}
            </Link>
          </h3>
        )}

        {sanitizedDescription && (
          <p className="text-body-sm text-muted-foreground line-clamp-2 mb-3">
            {sanitizedDescription}
          </p>
        )}

        {formattedDate && (
          <p className="text-caption text-muted-foreground">{formattedDate}</p>
        )}
      </div>
    </article>
  )
}

// Re-export card variants
export { FeaturedCard } from './FeaturedCard'
export { MinimalCard } from './MinimalCard'
