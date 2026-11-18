import type { Metadata } from 'next'
import configPromise from '@payload-config'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import { cache } from 'react'

import { ArticlesArchive, parsePageNumber } from '@/components/ArticlesArchive'
import type { Category, Tag } from '@/payload-types'
import { pageTitle } from '@/utilities/site'
import { CategoryArchive } from '../components/CategoryArchive'

type Args = {
  params: Promise<{ slug: string; rest: string[] }>
}

type Resolved =
  { type: 'category'; category: Category; page: number } | { type: 'tag'; tag: Tag; page: number }

const findBySlug = cache(async (collection: 'categories' | 'tags', slug: string) => {
  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection,
    limit: 1,
    pagination: false,
    depth: 0,
    overrideAccess: false,
    where: { slug: { equals: slug } },
  })
  return docs[0] ?? null
})

/**
 * Adresses publiques à plusieurs segments (hors /posts), aux formes WordPress :
 * - pages suivantes d'une rubrique : /culture/page/2
 * - mots-clés : /tag/portugal, /tag/portugal/page/2
 * Tout le reste est une 404 au design du site, plutôt que la 404 brute de Next.
 */
const resolve = cache(async (slug: string, rest: string[]): Promise<Resolved> => {
  const decoded = rest.map(decodeURIComponent)

  if (slug === 'tag') {
    const [tagSlug, pageSegment, pageNumber] = decoded
    const isFirstPage = decoded.length === 1
    const isNextPage = decoded.length === 3 && pageSegment === 'page'
    if (!tagSlug || !(isFirstPage || isNextPage)) notFound()
    const tag = (await findBySlug('tags', tagSlug)) as Tag | null
    if (!tag) notFound()
    const page = isFirstPage ? 1 : parsePageNumber(pageNumber, `/tag/${tag.slug}`)
    return { type: 'tag', tag, page }
  }

  if (decoded.length !== 2 || decoded[0] !== 'page') notFound()
  const category = (await findBySlug('categories', decodeURIComponent(slug))) as Category | null
  if (!category) notFound()
  return { type: 'category', category, page: parsePageNumber(decoded[1], `/${category.slug}`) }
})

export default async function MultiSegmentPage({ params }: Args) {
  const { slug, rest } = await params
  const resolved = await resolve(slug, rest)

  if (resolved.type === 'tag') {
    return (
      <ArticlesArchive
        title={resolved.tag.title}
        basePath={`/tag/${resolved.tag.slug}`}
        page={resolved.page}
        tagId={resolved.tag.id}
        contextPrefix="Mot-clé."
      />
    )
  }

  return <CategoryArchive category={resolved.category} page={resolved.page} />
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug, rest } = await params
  const resolved = await resolve(slug, rest)
  const suffix = resolved.page > 1 ? `, page ${resolved.page}` : ''

  if (resolved.type === 'tag') {
    const base = `/tag/${resolved.tag.slug}`
    return {
      title: pageTitle(`${resolved.tag.title}${suffix}`),
      alternates: { canonical: resolved.page > 1 ? `${base}/page/${resolved.page}` : base },
      // 877 mots-clés, souvent un seul article : navigables, mais hors de l'index
      robots: { index: false, follow: true },
    }
  }

  const base = `/${resolved.category.slug}`
  return {
    title: pageTitle(`${resolved.category.title}${suffix}`),
    alternates: { canonical: `${base}/page/${resolved.page}` },
  }
}
