import configPromise from '@payload-config'
import { notFound, permanentRedirect } from 'next/navigation'
import { getPayload, type Where } from 'payload'
import React from 'react'

import { ArchiveHeader, archiveContext } from '@/components/ArchiveHeader'
import { CollectionArchive } from '@/components/CollectionArchive'
import { Pagination } from '@/components/Pagination'

/** Un article en tête puis quatre rangées de trois : la grille tombe juste. */
export const ARCHIVE_PAGE_SIZE = 13

/**
 * Archive paginée d'articles publiés, du plus récent au plus ancien : une rubrique
 * (`categoryId`) ou tout le magazine. Une page au-delà de la dernière renvoie une 404.
 */
export async function ArticlesArchive({
  title,
  basePath,
  page = 1,
  categoryId,
}: {
  title: string
  basePath: string
  page?: number
  categoryId?: number
}) {
  const payload = await getPayload({ config: configPromise })

  const where: Where = categoryId
    ? { and: [{ _status: { equals: 'published' } }, { categories: { contains: categoryId } }] }
    : { _status: { equals: 'published' } }

  const posts = await payload.find({
    collection: 'posts',
    depth: 1,
    limit: ARCHIVE_PAGE_SIZE,
    page,
    sort: '-publishedAt',
    overrideAccess: false,
    where,
    select: {
      title: true,
      slug: true,
      categories: true,
      meta: true,
      heroImage: true,
      publishedAt: true,
    },
  })

  if (page > 1 && page > posts.totalPages) notFound()

  return (
    <>
      <ArchiveHeader
        title={title}
        context={archiveContext({ page, limit: ARCHIVE_PAGE_SIZE, totalDocs: posts.totalDocs })}
      />
      <CollectionArchive posts={posts.docs} lead />
      <div className="container">
        <Pagination page={page} totalPages={posts.totalPages} basePath={basePath} />
      </div>
    </>
  )
}

/**
 * Numéro de page lu dans l'URL : entier ≥ 2. /page/1 redirige vers l'adresse de base
 * (comme WordPress), tout le reste est une 404.
 */
export function parsePageNumber(value: string | undefined, basePath: string): number {
  const page = Number(value)
  if (page === 1) permanentRedirect(basePath)
  if (!Number.isInteger(page) || page < 2) notFound()
  return page
}
