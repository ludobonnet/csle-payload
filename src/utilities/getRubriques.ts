import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'

export type Rubrique = {
  id: number
  title: string
  slug: string
  count: number
}

/** Catégories techniques héritées de WordPress, jamais montrées aux lecteurs. */
const HIDDEN_SLUGS = new Set(['non-classe', 'uncategorized'])

async function fetchRubriques(): Promise<Rubrique[]> {
  const payload = await getPayload({ config: configPromise })

  const { docs } = await payload.find({
    collection: 'categories',
    limit: 100,
    pagination: false,
    depth: 0,
    overrideAccess: false,
    select: { title: true, slug: true },
  })

  const counted = await Promise.all(
    docs
      .filter((category) => category.slug && !HIDDEN_SLUGS.has(category.slug))
      .map(async (category) => {
        const { totalDocs } = await payload.count({
          collection: 'posts',
          overrideAccess: false,
          where: {
            and: [{ categories: { contains: category.id } }, { _status: { equals: 'published' } }],
          },
        })
        return {
          id: category.id,
          title: category.title,
          slug: category.slug,
          count: totalDocs,
        }
      }),
  )

  // Rubriques vides masquées ; les plus fournies d'abord, puis ordre alphabétique
  return counted
    .filter((rubrique) => rubrique.count > 0)
    .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title, 'fr'))
}

/**
 * Rubriques affichées dans la navigation et le pied de page. Mises en cache une heure :
 * une vingtaine de comptages ne doit pas peser sur chaque page rendue.
 */
export const getRubriques = unstable_cache(fetchRubriques, ['rubriques'], {
  tags: ['rubriques'],
  revalidate: 3600,
})
