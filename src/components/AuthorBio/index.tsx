import React from 'react'

import { Media } from '@/components/Media'
import type { AuthorProfile } from '@/utilities/getAuthorProfile'

/**
 * Encart auteur en fin d'article. N'apparaît que si l'auteur a une bio : le nom
 * figure déjà sous le titre. Les retours à la ligne de la bio sont conservés.
 */
export const AuthorBio: React.FC<{ author: AuthorProfile }> = ({ author }) => {
  const { name, bio, avatar } = author
  if (!name || !bio) return null

  return (
    <aside className="flex items-start gap-5 bg-wash p-6 md:p-8" aria-label={`À propos de ${name}`}>
      {avatar && typeof avatar === 'object' && (
        <div className="relative size-16 shrink-0 overflow-hidden rounded-full bg-muted">
          <Media resource={avatar} fill size="64px" />
        </div>
      )}
      <div>
        <p className="font-serif text-h4 text-ink">{name}</p>
        <p className="mt-2 whitespace-pre-line font-sans text-body-sm text-ink-soft">{bio}</p>
      </div>
    </aside>
  )
}
