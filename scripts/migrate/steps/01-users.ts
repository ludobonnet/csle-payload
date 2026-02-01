/**
 * Step 1: Migrate WordPress users to Payload
 * Creates 3 users based on the author mapping configuration
 */

import type { Payload } from 'payload'
import { config } from '../config.js'
import { info, success, warn, section } from '../utils/logger.js'

export interface UserMigrationResult {
  wpToPayloadMap: Map<number, number>
  created: number
  skipped: number
}

export async function migrateUsers(payload: Payload): Promise<UserMigrationResult> {
  section('Step 1: Migrating Users')

  const wpToPayloadMap = new Map<number, number>()
  let created = 0
  let skipped = 0

  for (const [wpIdStr, userInfo] of Object.entries(config.authorMapping)) {
    const wpId = parseInt(wpIdStr, 10)
    const { email, name } = userInfo

    try {
      // Check if user already exists
      const existing = await payload.find({
        collection: 'users',
        where: {
          email: { equals: email },
        },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        info(`User already exists: ${email}`)
        wpToPayloadMap.set(wpId, existing.docs[0].id)
        skipped++
        continue
      }

      // Create new user
      const newUser = await payload.create({
        collection: 'users',
        data: {
          email,
          name,
          password: config.defaultPassword,
        },
      })

      wpToPayloadMap.set(wpId, newUser.id)
      created++
      success(`Created user: ${email} (WP ID ${wpId} -> Payload ID ${newUser.id})`)
    } catch (err) {
      warn(`Failed to create user ${email}`, err)
    }
  }

  success(`Users migration complete: ${created} created, ${skipped} skipped`)

  return {
    wpToPayloadMap,
    created,
    skipped,
  }
}
