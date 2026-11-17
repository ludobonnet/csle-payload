import React from 'react'
import Link from 'next/link'
import { Media } from '@/components/Media'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { Post } from '@/payload-types'

type PostNavigationProps = {
  currentPost: Post
}

export async function PostNavigation({ currentPost }: PostNavigationProps) {
  const payload = await getPayload({ config: configPromise })

  // Get previous post (older, earlier publishedAt)
  const previousResult = await payload.find({
    collection: 'posts',
    where: {
      publishedAt: {
        less_than: currentPost.publishedAt,
      },
      _status: {
        equals: 'published',
      },
    },
    sort: '-publishedAt',
    limit: 1,
    overrideAccess: false,
  })

  // Get next post (newer, later publishedAt)
  const nextResult = await payload.find({
    collection: 'posts',
    where: {
      publishedAt: {
        greater_than: currentPost.publishedAt,
      },
      _status: {
        equals: 'published',
      },
    },
    sort: 'publishedAt',
    limit: 1,
    overrideAccess: false,
  })

  const previousPost = previousResult.docs[0] || null
  const nextPost = nextResult.docs[0] || null

  // Don't render if no navigation available
  if (!previousPost && !nextPost) {
    return null
  }

  return (
    <nav className="border-t border-border mt-16 pt-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Previous Post */}
        <div className="md:pr-8">
          {previousPost ? (
            <Link
              href={`/${previousPost.slug}`}
              className="group flex flex-col h-full hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center gap-2 text-caption text-muted-foreground mb-3">
                <ChevronLeft className="w-4 h-4" />
                <span className="uppercase tracking-wider">Article précédent</span>
              </div>
              <div className="flex gap-4 items-start">
                {(previousPost.heroImage || previousPost.meta?.image) && (
                  <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden rounded">
                    <Media
                      resource={
                        typeof previousPost.heroImage !== 'string'
                          ? previousPost.heroImage
                          : typeof previousPost.meta?.image !== 'string'
                            ? previousPost.meta?.image
                            : undefined
                      }
                      fill
                      size="80px"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-h5 text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {previousPost.title}
                  </h3>
                </div>
              </div>
            </Link>
          ) : (
            <div className="h-full opacity-0">
              {/* Spacer to maintain grid alignment */}
            </div>
          )}
        </div>

        {/* Next Post */}
        <div className="md:pl-8 md:border-l border-border">
          {nextPost ? (
            <Link
              href={`/${nextPost.slug}`}
              className="group flex flex-col h-full hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center justify-end gap-2 text-caption text-muted-foreground mb-3">
                <span className="uppercase tracking-wider">Article suivant</span>
                <ChevronRight className="w-4 h-4" />
              </div>
              <div className="flex gap-4 items-start flex-row-reverse">
                {(nextPost.heroImage || nextPost.meta?.image) && (
                  <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden rounded">
                    <Media
                      resource={
                        typeof nextPost.heroImage !== 'string'
                          ? nextPost.heroImage
                          : typeof nextPost.meta?.image !== 'string'
                            ? nextPost.meta?.image
                            : undefined
                      }
                      fill
                      size="80px"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0 text-right">
                  <h3 className="font-display text-h5 text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {nextPost.title}
                  </h3>
                </div>
              </div>
            </Link>
          ) : (
            <div className="h-full opacity-0">
              {/* Spacer to maintain grid alignment */}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
