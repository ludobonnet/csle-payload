import React from 'react'

import type { User, Media as MediaType } from '@/payload-types'
import { Media } from '@/components/Media'

// Accepte l'utilisateur complet ou la forme simplifiée de populatedAuthors
interface SimpleAuthor {
  id?: string | null
  name?: string | null
}

interface AuthorBioProps {
  author: SimpleAuthor | User
}

function isFullUser(author: SimpleAuthor | User): author is User {
  return 'bio' in author || 'avatar' in author
}

/**
 * Encart auteur en fin d'article. N'apparaît que si l'auteur a une bio : le nom
 * figure déjà sous le titre.
 */
export const AuthorBio: React.FC<AuthorBioProps> = ({ author }) => {
  const name = author.name
  const bio = isFullUser(author) ? author.bio : null
  const avatar = isFullUser(author) ? author.avatar : null

  if (!name || !bio) return null

  return (
    <aside className="flex items-start gap-5 bg-wash p-6 md:p-8" aria-label={`À propos de ${name}`}>
      {avatar && typeof avatar === 'object' && (
        <div className="relative size-16 shrink-0 overflow-hidden rounded-full bg-muted">
          <Media resource={avatar as MediaType} fill size="64px" />
        </div>
      )}
      <div>
        <p className="font-serif text-h4 text-ink">{name}</p>
        <p className="mt-2 font-sans text-body-sm text-ink-soft">{bio}</p>
      </div>
    </aside>
  )
}
