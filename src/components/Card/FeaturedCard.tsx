'use client'
import { cn } from '@/utilities/ui'
import useClickableCard from '@/utilities/useClickableCard'
import Link from 'next/link'
import React, { Fragment } from 'react'

import type { Post } from '@/payload-types'

import { Media } from '@/components/Media'

export type FeaturedCardPostData = Pick<Post, 'slug' | 'categories' | 'meta' | 'title' | 'heroImage'>

export const FeaturedCard: React.FC<{
  className?: string
  doc?: FeaturedCardPostData
  showCategories?: boolean
}> = (props) => {
  const { card, link } = useClickableCard({})
  const { className, doc, showCategories } = props

  const { slug, categories, meta, title, heroImage } = doc || {}
  const { image: metaImage } = meta || {}
  const displayImage = heroImage || metaImage

  const hasCategories = categories && Array.isArray(categories) && categories.length > 0
  const href = `/${slug}`

  return (
    <article
      className={cn(
        'group relative overflow-hidden bg-card hover:cursor-pointer aspect-[16/9] min-h-[400px]',
        className,
      )}
      ref={card.ref}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        {displayImage && typeof displayImage !== 'string' ? (
          <Media
            resource={displayImage}
            fill
            size="(max-width: 1024px) 100vw, 66vw"
            className="h-full transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="w-full h-full bg-muted" />
        )}
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 lg:p-10">
        {showCategories && hasCategories && (
          <div className="text-overline uppercase tracking-wider text-white/80 mb-3">
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
          <h2 className="font-display text-h2 md:text-display text-white leading-tight">
            <Link href={href} ref={link.ref} className="hover:underline underline-offset-4">
              {title}
            </Link>
          </h2>
        )}
      </div>
    </article>
  )
}
