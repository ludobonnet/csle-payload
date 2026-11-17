import { getServerSideSitemap } from 'next-sitemap'
import { getPayload } from 'payload'
import config from '@payload-config'
import { unstable_cache } from 'next/cache'

/**
 * Accueil, archive, pages publiées et catégories non vides (servies à la racine,
 * comme sur WordPress). La recherche est volontairement absente (noindex).
 */
const getPagesSitemap = unstable_cache(
  async () => {
    const payload = await getPayload({ config })
    const SITE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://csle.fr'
    const now = new Date().toISOString()

    const [pages, categories, posts] = await Promise.all([
      payload.find({
        collection: 'pages',
        overrideAccess: false,
        draft: false,
        depth: 0,
        pagination: false,
        where: { _status: { equals: 'published' } },
        select: { slug: true, updatedAt: true },
      }),
      payload.find({
        collection: 'categories',
        overrideAccess: false,
        depth: 0,
        pagination: false,
        select: { slug: true },
      }),
      payload.find({
        collection: 'posts',
        overrideAccess: false,
        draft: false,
        depth: 0,
        pagination: false,
        where: { _status: { equals: 'published' } },
        select: { categories: true, updatedAt: true },
      }),
    ])

    // Dernière mise à jour par catégorie ; une catégorie sans article publié n'est pas listée
    const lastmodByCategory = new Map<number, string>()
    for (const post of posts.docs) {
      for (const category of post.categories ?? []) {
        const id = typeof category === 'object' ? category.id : category
        const previous = lastmodByCategory.get(id)
        if (!previous || post.updatedAt > previous) lastmodByCategory.set(id, post.updatedAt)
      }
    }

    return [
      { loc: `${SITE_URL}/`, lastmod: now },
      { loc: `${SITE_URL}/posts`, lastmod: now },
      ...pages.docs
        .filter((page) => page.slug && page.slug !== 'home')
        .map((page) => ({ loc: `${SITE_URL}/${page.slug}`, lastmod: page.updatedAt })),
      ...categories.docs
        .filter((category) => category.slug && lastmodByCategory.has(category.id))
        .map((category) => ({
          loc: `${SITE_URL}/${category.slug}`,
          lastmod: lastmodByCategory.get(category.id),
        })),
    ]
  },
  ['pages-sitemap'],
  // Invalidé par les hooks des pages ; les catégories, elles, n'ont pas de hook : rafraîchi toutes les heures
  { tags: ['pages-sitemap'], revalidate: 3600 },
)

export async function GET() {
  return getServerSideSitemap(await getPagesSitemap())
}
