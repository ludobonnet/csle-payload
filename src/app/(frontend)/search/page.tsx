import type { Metadata } from 'next/types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import Link from 'next/link'
import React, { Suspense } from 'react'

import { ArchiveHeader } from '@/components/ArchiveHeader'
import { CollectionArchive } from '@/components/CollectionArchive'
import { Search } from '@/search/Component'
import { getRubriques } from '@/utilities/getRubriques'
import { pageTitle } from '@/utilities/site'
import PageClient from './page.client'

type Args = {
  searchParams: Promise<{
    q?: string
  }>
}

const MAX_RESULTS = 24

/** Recherche dans les titres et les descriptions des articles publiés. */
export default async function Page({ searchParams: searchParamsPromise }: Args) {
  const { q } = await searchParamsPromise
  const query = q?.trim() ?? ''
  const payload = await getPayload({ config: configPromise })

  const [posts, rubriques, published] = await Promise.all([
    query
      ? payload.find({
          collection: 'posts',
          depth: 1,
          limit: MAX_RESULTS,
          sort: '-publishedAt',
          overrideAccess: false,
          where: {
            and: [
              { _status: { equals: 'published' } },
              {
                or: [{ title: { like: query } }, { 'meta.description': { like: query } }],
              },
            ],
          },
          select: {
            title: true,
            slug: true,
            categories: true,
            meta: true,
            heroImage: true,
            publishedAt: true,
          },
        })
      : null,
    query ? Promise.resolve([]) : getRubriques(),
    query
      ? null
      : payload.count({
          collection: 'posts',
          overrideAccess: false,
          where: { _status: { equals: 'published' } },
        }),
  ])

  const total = posts?.totalDocs ?? 0
  const context = !query
    ? `${(published?.totalDocs ?? 0).toLocaleString('fr-FR')} articles depuis 2008. Cherchez par lieu, par artiste, par sujet.`
    : total === 0
      ? `Aucun article ne correspond à « ${query} ». Essayez un mot plus court ou une autre orthographe.`
      : total > MAX_RESULTS
        ? `${total} articles correspondent à « ${query} ». Voici les ${MAX_RESULTS} plus récents.`
        : `${total} article${total > 1 ? 's' : ''} pour « ${query} ».`

  return (
    <>
      <PageClient />
      <ArchiveHeader title="Recherche" context={context}>
        <Suspense>
          <Search />
        </Suspense>
      </ArchiveHeader>

      {posts && total > 0 && <CollectionArchive posts={posts.docs} />}

      {/* Sans recherche : les rubriques, pour feuilleter plutôt que chercher */}
      {!query && rubriques.length > 0 && (
        <nav aria-label="Rubriques" className="container">
          <ul className="flex flex-wrap gap-x-8 gap-y-3 border-t border-line pt-8">
            {rubriques.map((rubrique) => (
              <li key={rubrique.id}>
                <Link href={`/${rubrique.slug}`} className="font-serif text-h4 text-ink lien">
                  {rubrique.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: pageTitle('Recherche'),
    robots: { index: false },
  }
}
