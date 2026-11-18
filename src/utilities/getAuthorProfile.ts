import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'

import type { User } from '@/payload-types'

export type AuthorProfile = Pick<User, 'id' | 'name' | 'bio' | 'avatar'>

/**
 * Profil public d'un auteur : nom, bio, avatar, rien d'autre. La collection `users` est
 * fermée au public ; la lecture passe outre le contrôle d'accès mais ne sélectionne que ces
 * trois champs (ni e-mail, ni données de connexion).
 */
export const getAuthorProfile = cache(
  async (id: number | string): Promise<AuthorProfile | null> => {
    const payload = await getPayload({ config: configPromise })
    try {
      const user = await payload.findByID({
        collection: 'users',
        id,
        depth: 1,
        overrideAccess: true,
        select: { name: true, bio: true, avatar: true },
      })
      return { id: user.id, name: user.name, bio: user.bio, avatar: user.avatar }
    } catch {
      return null
    }
  },
)
