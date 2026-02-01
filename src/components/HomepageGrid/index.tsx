import React from 'react'
import Link from 'next/link'

import type { Post } from '@/payload-types'
import { Card, FeaturedCard, MinimalCard } from '@/components/Card'

interface HomepageGridProps {
  posts: Post[]
  title?: string
  showViewAll?: boolean
  viewAllHref?: string
  viewAllLabel?: string
}

export const HomepageGrid: React.FC<HomepageGridProps> = ({
  posts,
  title,
  showViewAll = false,
  viewAllHref = '/posts',
  viewAllLabel = 'Voir tout',
}) => {
  if (!posts || posts.length === 0) return null

  // Distribute posts into different card types for visual variety
  // Pattern: 1 featured (8 cols), 2-3 standard (4 cols each), 2 minimal (4 cols each)
  const featuredPost = posts[0]
  const standardPosts = posts.slice(1, 4)
  const minimalPosts = posts.slice(4, 7)
  const remainingPosts = posts.slice(7)

  return (
    <section className="py-12 md:py-16 lg:py-24">
      <div className="container">
        {/* Section header */}
        {title && (
          <div className="flex items-baseline justify-between mb-8 md:mb-12">
            <h2 className="font-display text-h2 text-foreground">{title}</h2>
            {showViewAll && (
              <Link
                href={viewAllHref}
                className="text-body-sm text-primary hover:text-primary-hover transition-colors group inline-flex items-center gap-1"
              >
                {viewAllLabel}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-transform group-hover:translate-x-0.5"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>
        )}

        {/* Asymmetric grid - Kinfolk style */}
        <div className="grid grid-cols-12 gap-6 md:gap-8 lg:gap-10">
          {/* Featured post - spans 8 columns on large screens */}
          {featuredPost && (
            <div className="col-span-12 lg:col-span-8">
              <FeaturedCard doc={featuredPost} showCategories />
            </div>
          )}

          {/* First standard post - 4 columns, stacked on the right */}
          {standardPosts[0] && (
            <div className="col-span-12 sm:col-span-6 lg:col-span-4">
              <Card doc={standardPosts[0]} showCategories />
            </div>
          )}

          {/* Second and third standard posts */}
          {standardPosts[1] && (
            <div className="col-span-12 sm:col-span-6 lg:col-span-4">
              <Card doc={standardPosts[1]} showCategories />
            </div>
          )}
          {standardPosts[2] && (
            <div className="col-span-12 sm:col-span-6 lg:col-span-4">
              <Card doc={standardPosts[2]} showCategories />
            </div>
          )}

          {/* Minimal posts - text only, with accent border */}
          {minimalPosts.length > 0 && (
            <div className="col-span-12 lg:col-span-4 space-y-6">
              {minimalPosts.map((post) => (
                <MinimalCard key={post.id} doc={post} showCategories />
              ))}
            </div>
          )}

          {/* Remaining posts as standard cards */}
          {remainingPosts.map((post) => (
            <div key={post.id} className="col-span-12 sm:col-span-6 lg:col-span-4">
              <Card doc={post} showCategories />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
