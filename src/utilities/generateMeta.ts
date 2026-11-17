import type { Metadata } from 'next'

import type { Media, Page, Post, Config } from '../payload-types'

import { mergeOpenGraph } from './mergeOpenGraph'
import { getServerSideURL } from './getURL'
import { pageTitle, SITE_NAME } from './site'

/** Image OG du document (taille « og » si disponible), absolue ; aucune sinon. */
const getImageURL = (image?: Media | Config['db']['defaultIDType'] | null): string | undefined => {
  if (!image || typeof image !== 'object') return undefined

  const mediaUrl = image.sizes?.og?.url || image.url
  if (!mediaUrl) return undefined

  // URL absolue (R2) ou relative (stockage disque en dev)
  return /^https?:\/\//.test(mediaUrl) ? mediaUrl : getServerSideURL() + mediaUrl
}

export const generateMeta = async (args: {
  doc: Partial<Page> | Partial<Post> | null
}): Promise<Metadata> => {
  const { doc } = args

  // Articles migrés : pas d'image SEO dédiée, l'image principale en tient lieu
  const heroImage = doc && 'heroImage' in doc ? doc.heroImage : null
  const ogImage = getImageURL(doc?.meta?.image || heroImage)

  // meta.title est déjà suffixé par le plugin SEO (generateTitle) ; sinon on suffixe ici
  // Accueil : « CSLE - <description> » sauf titre SEO saisi explicitement
  const rawTitle = doc?.slug === 'home' ? doc?.meta?.title : doc?.meta?.title || doc?.title
  const title = rawTitle?.endsWith(` - ${SITE_NAME}`) ? rawTitle : pageTitle(rawTitle)

  return {
    description: doc?.meta?.description,
    openGraph: mergeOpenGraph({
      description: doc?.meta?.description || '',
      images: ogImage ? [{ url: ogImage }] : undefined,
      title,
      url: !doc?.slug || doc.slug === 'home' ? '/' : `/${doc.slug}`,
    }),
    title,
  }
}
