import React from 'react'
import Link from 'next/link'

import type { Post } from '@/payload-types'
import { Media } from '@/components/Media'

interface HomeHeroProps {
  post: Post
}

export const HomeHero: React.FC<HomeHeroProps> = ({ post }) => {
  const { title, slug, heroImage, categories } = post

  const hasCategories = categories && Array.isArray(categories) && categories.length > 0

  return (
    <section className="relative w-full min-h-[70vh] flex items-end overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        {heroImage && typeof heroImage !== 'string' ? (
          <Media
            resource={heroImage}
            fill
            priority
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted" />
        )}
      </div>

      {/* Gradient Overlay - subtle, for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* Content - positioned bottom-left, Kinfolk style */}
      <div className="relative z-10 container py-12 md:py-16 lg:py-20">
        <div className="max-w-3xl">
          {/* Category label */}
          {hasCategories && (
            <div className="text-overline uppercase tracking-widest text-white/80 mb-4">
              {categories.map((category, index) => {
                if (typeof category === 'object' && category.title) {
                  return (
                    <span key={index}>
                      {index > 0 && ', '}
                      {category.title}
                    </span>
                  )
                }
                return null
              })}
            </div>
          )}

          {/* Title - large, editorial */}
          <h1 className="font-display text-h1 md:text-display text-white leading-tight mb-6">
            <Link
              href={`/${slug}`}
              className="hover:underline underline-offset-4 decoration-2"
            >
              {title}
            </Link>
          </h1>

          {/* CTA */}
          <Link
            href={`/${slug}`}
            className="inline-flex items-center gap-2 text-body text-white/90 hover:text-white transition-colors group"
          >
            Lire l&apos;article
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform group-hover:translate-x-1"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}
