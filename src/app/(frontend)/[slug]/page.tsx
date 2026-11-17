import type { Metadata } from 'next'

import { PayloadRedirects } from '@/components/PayloadRedirects'
import configPromise from '@payload-config'
import { getPayload, type RequiredDataFromCollectionSlug } from 'payload'
import { draftMode } from 'next/headers'
import React, { cache } from 'react'
import { SITE_DESCRIPTION, SITE_NAME } from '@/utilities/site'

import { generateMeta } from '@/utilities/generateMeta'
import PageClient from './page.client'
import { LivePreviewListener } from '@/components/LivePreviewListener'

import { PageContent } from './components/PageContent'
import { PostContent } from './components/PostContent'
import { CategoryArchive } from './components/CategoryArchive'
import { HomeContent } from './components/HomeContent'

import type { Category, Post } from '@/payload-types'

type ResolvedSlug =
  | { type: 'page'; data: RequiredDataFromCollectionSlug<'pages'> }
  | { type: 'home'; data: { page: RequiredDataFromCollectionSlug<'pages'>; featuredPosts: Post[] } }
  | { type: 'category'; data: Category }
  | { type: 'post'; data: Post }
  | { type: 'not-found'; data: null }

// Rendu à la requête, comme tout le site public (voir le layout)
export const dynamic = 'force-dynamic'

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function DynamicPage({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { slug = 'home' } = await paramsPromise
  const decodedSlug = decodeURIComponent(slug)
  const url = '/' + decodedSlug

  const resolved = await resolveSlug({ slug: decodedSlug, draft })

  switch (resolved.type) {
    case 'home':
      return (
        <div>
          <PageClient />
          <PayloadRedirects disableNotFound url={url} />
          {draft && <LivePreviewListener />}
          <HomeContent page={resolved.data.page} featuredPosts={resolved.data.featuredPosts} />
        </div>
      )

    case 'page':
      return (
        <article className="pt-16 pb-24">
          <PageClient />
          <PayloadRedirects disableNotFound url={url} />
          {draft && <LivePreviewListener />}
          <PageContent page={resolved.data} />
        </article>
      )

    case 'category':
      return (
        <div>
          <PageClient />
          <PayloadRedirects disableNotFound url={url} />
          {draft && <LivePreviewListener />}
          <CategoryArchive category={resolved.data} />
        </div>
      )

    case 'post':
      return (
        <article>
          <PageClient />
          <PayloadRedirects disableNotFound url={url} />
          {draft && <LivePreviewListener />}
          <PostContent post={resolved.data} />
        </article>
      )

    case 'not-found':
    default:
      return <PayloadRedirects url={url} />
  }
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = 'home' } = await paramsPromise
  const decodedSlug = decodeURIComponent(slug)
  const { isEnabled: draft } = await draftMode()

  const resolved = await resolveSlug({ slug: decodedSlug, draft })

  if (resolved.type === 'not-found') {
    return {}
  }

  // For home page, use the page data for metadata
  if (resolved.type === 'home') {
    return generateMeta({ doc: resolved.data.page })
  }

  return generateMeta({ doc: resolved.data })
}

/** Accueil sans page « home » en base : derniers articles seuls, méta du site. */
const HOME_FALLBACK: RequiredDataFromCollectionSlug<'pages'> = {
  slug: 'home',
  title: SITE_NAME,
  hero: { type: 'none' },
  layout: [],
  meta: { description: SITE_DESCRIPTION },
}

const resolveSlug = cache(
  async ({ slug, draft }: { slug: string; draft: boolean }): Promise<ResolvedSlug> => {
    const payload = await getPayload({ config: configPromise })

    // Special case: home page with featured posts
    if (slug === 'home') {
      const [pageResult, postsResult] = await Promise.all([
        payload.find({
          collection: 'pages',
          draft,
          limit: 1,
          pagination: false,
          overrideAccess: draft,
          where: { slug: { equals: 'home' } },
        }),
        payload.find({
          collection: 'posts',
          draft: false,
          // L'accueil n'ouvre que sur le dernier article ; les sections chargent le reste
          limit: 1,
          pagination: false,
          overrideAccess: false,
          sort: '-publishedAt',
          where: { _status: { equals: 'published' } },
        }),
      ])

      const homePage = pageResult.docs[0] || HOME_FALLBACK
      return {
        type: 'home',
        data: {
          page: homePage,
          featuredPosts: postsResult.docs,
        },
      }
    }

    // 1. Check pages first
    const pageResult = await payload.find({
      collection: 'pages',
      draft,
      limit: 1,
      pagination: false,
      overrideAccess: draft,
      where: {
        slug: { equals: slug },
      },
    })

    if (pageResult.docs.length > 0) {
      return { type: 'page', data: pageResult.docs[0] }
    }

    // 2. Check categories
    const categoryResult = await payload.find({
      collection: 'categories',
      limit: 1,
      pagination: false,
      overrideAccess: false,
      where: {
        slug: { equals: slug },
      },
    })

    if (categoryResult.docs.length > 0) {
      return { type: 'category', data: categoryResult.docs[0] }
    }

    // 3. Check posts
    const postResult = await payload.find({
      collection: 'posts',
      draft,
      limit: 1,
      pagination: false,
      overrideAccess: draft,
      where: {
        slug: { equals: slug },
      },
    })

    if (postResult.docs.length > 0) {
      return { type: 'post', data: postResult.docs[0] }
    }

    // 4. Not found
    return { type: 'not-found', data: null }
  },
)
