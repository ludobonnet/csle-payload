import React from 'react'

import type { User, Media as MediaType } from '@/payload-types'
import { Media } from '@/components/Media'

// Support both full User type and simplified populatedAuthors type
interface SimpleAuthor {
  id?: string | null
  name?: string | null
}

interface AuthorBioProps {
  author: SimpleAuthor | User
}

// Type guard to check if author has full User data
function isFullUser(author: SimpleAuthor | User): author is User {
  return 'bio' in author || 'avatar' in author
}

export const AuthorBio: React.FC<AuthorBioProps> = ({ author }) => {
  const name = author.name
  const bio = isFullUser(author) ? author.bio : null
  const avatar = isFullUser(author) ? author.avatar : null

  if (!name) return null

  return (
    <div className="border-t border-border pt-8 mt-12">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative w-16 h-16 rounded-full overflow-hidden bg-muted flex-shrink-0">
          {avatar && typeof avatar !== 'string' ? (
            <Media
              resource={avatar as MediaType}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M20 21a8 8 0 0 0-16 0" />
              </svg>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1">
          <p className="text-overline text-muted-foreground uppercase tracking-wider mb-1">
            Écrit par
          </p>
          <h4 className="font-display text-h4 text-foreground mb-2">{name}</h4>
          {bio && (
            <p className="text-body-sm text-muted-foreground leading-relaxed">{bio}</p>
          )}
        </div>
      </div>
    </div>
  )
}
