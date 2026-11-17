import type { Metadata } from 'next'
import configPromise from '@payload-config'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import { cache } from 'react'

import { parsePageNumber } from '@/components/ArticlesArchive'
import { pageTitle } from '@/utilities/site'
import { CategoryArchive } from '../components/CategoryArchive'

type Args = {
  params: Promise<{ slug: string; rest: string[] }>
}

const findCategory = cache(async (slug: string) => {
  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'categories',
    limit: 1,
    pagination: false,
    overrideAccess: false,
    where: { slug: { equals: slug } },
  })
  return docs[0] ?? null
})

/**
 * Seule adresse publique à plusieurs segments hors /posts : les pages suivantes d'une
 * rubrique, /culture/page/2 (forme WordPress). Tout le reste est une 404 au design du site,
 * plutôt que la 404 brute de Next (deux layouts racines : site et admin).
 */
export default async function CategoryPage({ params }: Args) {
  const { slug, rest } = await params
  if (rest.length !== 2 || rest[0] !== 'page') notFound()

  const category = await findCategory(decodeURIComponent(slug))
  if (!category) notFound()
  const page = parsePageNumber(rest[1], `/${category.slug}`)

  return <CategoryArchive category={category} page={page} />
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug, rest } = await params
  if (rest.length !== 2 || rest[0] !== 'page') return {}
  const category = await findCategory(decodeURIComponent(slug))
  if (!category) return {}
  return {
    title: pageTitle(`${category.title}, page ${rest[1]}`),
    alternates: { canonical: `/${category.slug}/page/${rest[1]}` },
  }
}
