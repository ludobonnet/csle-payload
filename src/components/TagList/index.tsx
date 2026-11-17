import type { Tag } from '@/payload-types'
import { cn } from '@/utilities/ui'

type Props = {
  tags: (Tag | number)[]
  className?: string
}

/**
 * Mots-clés de l'article, en texte simple. Pas de liens : il n'existe pas (encore) de page
 * par mot-clé, et l'ancienne URL /tag/… mènerait à une 404.
 */
export function TagList({ tags, className }: Props) {
  const populatedTags = tags.filter((tag): tag is Tag => typeof tag === 'object')

  if (populatedTags.length === 0) {
    return null
  }

  return (
    <p className={cn('meta', className)}>
      <span className="font-semibold text-ink">Mots-clés : </span>
      {populatedTags.map((tag) => tag.title).join(', ')}
    </p>
  )
}
