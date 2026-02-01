/**
 * Step 2b: Migrate WordPress tags to Payload
 */

import type { Payload } from 'payload'
import { query, wpTable, type WPTerm } from '../utils/db.js'
import { info, success, warn, section, startProgress, updateProgress, endProgress } from '../utils/logger.js'

export interface TagMigrationResult {
  wpToPayloadMap: Map<number, number>
  created: number
  skipped: number
}

interface TagRow extends WPTerm {
  term_taxonomy_id: number
  taxonomy: string
}

export async function migrateTags(payload: Payload): Promise<TagMigrationResult> {
  section('Step 2b: Migrating Tags')

  const wpToPayloadMap = new Map<number, number>()
  let created = 0
  let skipped = 0

  // Query WordPress tags
  const tags = await query<TagRow>(`
    SELECT t.term_id, t.name, t.slug, tt.term_taxonomy_id, tt.taxonomy
    FROM ${wpTable('terms')} t
    JOIN ${wpTable('term_taxonomy')} tt ON t.term_id = tt.term_id
    WHERE tt.taxonomy = 'post_tag'
    ORDER BY t.name
  `)

  info(`Found ${tags.length} tags in WordPress`)

  if (tags.length === 0) {
    info('No tags found in WordPress database')
    return { wpToPayloadMap, created, skipped }
  }

  startProgress('Tags', tags.length)

  for (const tag of tags) {
    try {
      // Check if tag already exists by slug
      const existing = await payload.find({
        collection: 'tags',
        where: {
          slug: { equals: tag.slug },
        },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        wpToPayloadMap.set(tag.term_id, existing.docs[0].id)
        skipped++
        updateProgress(1)
        continue
      }

      // Create new tag
      const newTag = await payload.create({
        collection: 'tags',
        data: {
          title: tag.name,
          slug: tag.slug,
        },
      })

      wpToPayloadMap.set(tag.term_id, newTag.id)
      created++
      updateProgress(1)
    } catch (err) {
      warn(`Failed to create tag: ${tag.name}`, err)
      updateProgress(1)
    }
  }

  endProgress()
  success(`Tags migration complete: ${created} created, ${skipped} skipped`)

  return {
    wpToPayloadMap,
    created,
    skipped,
  }
}
