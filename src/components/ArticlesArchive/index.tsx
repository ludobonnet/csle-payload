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
 * (`categoryId`), un mot-clé (`tagId`) ou tout le magazine. Une page au-delà de la
 * dernière renvoie une 404, comme une archive vide (mot-clé sans article publié).
 */
export async function ArticlesArchive({
  title,
  basePath,
  page = 1,
  categoryId,
  tagId,
  contextPrefix,
}: {
  title: string
  basePath: string
  page?: number
  categoryId?: number
  tagId?: number
  /** Placé avant le décompte : « Mot-clé. » */
  contextPrefix?: string
}) {
  const payload = await getPayload({ config: configPromise })

  const filters: Where[] = [{ _status: { equals: 'published' } }]
  if (categoryId) filters.push({ categories: { contains: categoryId } })
  if (tagId) filters.push({ tags: { contains: tagId } })
  const where: Where = { and: filters }

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

  if ((page > 1 && page > posts.totalPages) || (tagId && posts.totalDocs === 0)) notFound()

  return (
    <>
      <ArchiveHeader
        title={title}
        context={[
          contextPrefix,
          archiveContext({ page, limit: ARCHIVE_PAGE_SIZE, totalDocs: posts.totalDocs }),
        ]
          .filter(Boolean)
          .join(' ')}
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
