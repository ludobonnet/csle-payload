import React from 'react'
import Link from 'next/link'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

import type { Post } from '@/payload-types'
import { Media } from '@/components/Media'
import { cn } from '@/utilities/ui'

type PostNavigationProps = {
  currentPost: Post
}

type VoisinPost = Pick<Post, 'id' | 'title' | 'slug' | 'heroImage' | 'meta'>

const select = { title: true, slug: true, heroImage: true, meta: true } as const

/** Article plus ancien / plus récent, par date de publication. */
export async function PostNavigation({ currentPost }: PostNavigationProps) {
  if (!currentPost.publishedAt) return null
  const payload = await getPayload({ config: configPromise })

  const [olderResult, newerResult] = await Promise.all([
    payload.find({
      collection: 'posts',
      where: {
        publishedAt: { less_than: currentPost.publishedAt },
        _status: { equals: 'published' },
      },
      sort: '-publishedAt',
      limit: 1,
      depth: 1,
      select,
      overrideAccess: false,
    }),
    payload.find({
      collection: 'posts',
      where: {
        publishedAt: { greater_than: currentPost.publishedAt },
        _status: { equals: 'published' },
      },
      sort: 'publishedAt',
      limit: 1,
      depth: 1,
      select,
      overrideAccess: false,
    }),
  ])

  const older = olderResult.docs[0] as VoisinPost | undefined
  const newer = newerResult.docs[0] as VoisinPost | undefined

  if (!older && !newer) return null

  return (
    <nav aria-label="Autres articles" className="grid border-y border-line md:grid-cols-2">
      {older ? <Voisin post={older} label="Plus ancien" /> : <span aria-hidden="true" />}
      {newer && (
        <Voisin post={newer} label="Plus récent" className="border-t md:border-l md:border-t-0" />
      )}
    </nav>
  )
}

function Voisin({
  post,
  label,
  className,
}: {
  post: VoisinPost
  label: string
  className?: string
}) {
  const image =
    post.heroImage && typeof post.heroImage === 'object'
      ? post.heroImage
      : post.meta?.image && typeof post.meta.image === 'object'
        ? post.meta.image
        : null

  return (
    <Link
      href={`/${post.slug}`}
      className={cn('group flex items-start gap-5 border-line py-8 md:px-8', className)}
    >
      {image && (
        <div className="relative size-20 shrink-0 overflow-hidden bg-muted md:size-24">
          <Media resource={image} fill size="96px" />
        </div>
      )}
      <div>
        <p className="font-sans font-condensed text-[0.9375rem] font-semibold text-sauge-ink">
          {label}
        </p>
        <p className="mt-1.5 font-serif text-h4 text-ink text-pretty group-hover:underline group-hover:decoration-sauge group-hover:decoration-[1.5px] group-hover:underline-offset-4">
          {post.title}
        </p>
      </div>
    </Link>
  )
}
