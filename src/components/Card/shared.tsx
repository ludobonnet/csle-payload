import React from 'react'

import type { Category, Media, Post } from '@/payload-types'
import { formatDateTime } from '@/utilities/formatDateTime'
import { cn } from '@/utilities/ui'

export type CardPostData = Pick<
  Post,
  'slug' | 'categories' | 'meta' | 'title' | 'heroImage' | 'publishedAt'
>

/** Rubriques lisibles d'un article (sans la catégorie technique « Non classé »). */
export const rubriquesOf = (categories: Post['categories']): Category[] =>
  (categories ?? []).filter(
    (category): category is Category =>
      typeof category === 'object' && category !== null && category.slug !== 'non-classe',
  )

/** Photo d'un article : image d'en-tête, sinon image de partage. */
export const imageOf = (doc: Partial<CardPostData>): Media | null => {
  if (doc.heroImage && typeof doc.heroImage === 'object') return doc.heroImage
  if (doc.meta?.image && typeof doc.meta.image === 'object') return doc.meta.image
  return null
}

/** Libellé de rubrique au-dessus d'un titre de carte. */
export const RubriqueLabel: React.FC<{ categories: Post['categories']; className?: string }> = ({
  categories,
  className,
}) => {
  const rubriques = rubriquesOf(categories)
  if (rubriques.length === 0) return null
  return (
    <p
      className={cn(
        'font-sans font-condensed text-[0.875rem] font-semibold text-sauge-ink',
        className,
      )}
    >
      {rubriques.map((rubrique) => rubrique.title).join(', ')}
    </p>
  )
}

export const PostDate: React.FC<{ publishedAt?: string | null; className?: string }> = ({
  publishedAt,
  className,
}) =>
  publishedAt ? (
    <time dateTime={publishedAt} className={cn('meta block', className)}>
      {formatDateTime(publishedAt)}
    </time>
  ) : null

/** Classe du lien-titre : toute la carte est cliquable, le titre se souligne au survol. */
export const titleLinkClass =
  'lien-etendu decoration-sauge decoration-[1.5px] underline-offset-[0.18em] group-hover:underline'

/** Emplacement d'image vide : un aplat discret, pas d'icône. */
export const ImageFallback = () => <div className="h-full w-full bg-wash" aria-hidden="true" />
