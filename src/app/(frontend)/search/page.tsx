import type { Metadata } from 'next/types'

import configPromise from '@payload-config'
import { getPayload, type Payload } from 'payload'
import Link from 'next/link'
import React, { Suspense } from 'react'

import { ArchiveHeader } from '@/components/ArchiveHeader'
import { CollectionArchive } from '@/components/CollectionArchive'
import { Search } from '@/search/Component'
import { getRubriques } from '@/utilities/getRubriques'
import { searchPostIds } from '@/utilities/searchPosts'
import { pageTitle } from '@/utilities/site'
import PageClient from './page.client'

type Args = {
  searchParams: Promise<{
    q?: string
  }>
}

const MAX_RESULTS = 24

/** Recherche plein texte dans les articles publiés (titre, description, texte). */
export default async function Page({ searchParams: searchParamsPromise }: Args) {
  const { q } = await searchParamsPromise
  const query = q?.trim() ?? ''
  const payload = await getPayload({ config: configPromise })

  const [found, rubriques, published] = await Promise.all([
    query ? findPosts(payload, query) : null,
    query ? Promise.resolve([]) : getRubriques(),
    query
      ? null
      : payload.count({
          collection: 'posts',
          overrideAccess: false,
          where: { _status: { equals: 'published' } },
        }),
  ])

  const total = found?.total ?? 0
  const context = !query
    ? `${(published?.totalDocs ?? 0).toLocaleString('fr-FR')} articles depuis 2008. Cherchez par lieu, par artiste, par sujet.`
    : query.length < 2
      ? 'Tapez au moins deux lettres.'
      : total === 0
        ? `Aucun article ne correspond à « ${query} ». Essayez un mot plus court ou une autre orthographe.`
        : total > MAX_RESULTS
          ? `${total} articles correspondent à « ${query} ». Voici les ${MAX_RESULTS} plus pertinents.`
          : `${total} article${total > 1 ? 's' : ''} pour « ${query} ».`

  return (
    <>
      <PageClient />
      <ArchiveHeader title="Recherche" context={context}>
        <Suspense>
          <Search />
        </Suspense>
      </ArchiveHeader>

      {found && found.docs.length > 0 && <CollectionArchive posts={found.docs} />}

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

/**
 * Identifiants trouvés en SQL, puis articles relus par l'API locale (contrôle d'accès,
 * relations) et remis dans l'ordre de pertinence.
 */
async function findPosts(payload: Payload, query: string) {
  const ids = await searchPostIds(payload, query)
  if (ids.length === 0) return { total: 0, docs: [] }

  const firstIds = ids.slice(0, MAX_RESULTS)
  const { docs } = await payload.find({
    collection: 'posts',
    depth: 1,
    limit: MAX_RESULTS,
    pagination: false,
    overrideAccess: false,
    where: { and: [{ _status: { equals: 'published' } }, { id: { in: firstIds } }] },
    select: {
      title: true,
      slug: true,
      categories: true,
      meta: true,
      heroImage: true,
      publishedAt: true,
    },
  })
  const rank = new Map(firstIds.map((id, index) => [id, index]))
  docs.sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0))
  return { total: ids.length, docs }
}
