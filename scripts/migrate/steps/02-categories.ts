/**
 * Step 2: Migrate WordPress categories to Payload
 */

import type { Payload } from 'payload'
import { query, wpTable, type WPTerm, type WPTermTaxonomy } from '../utils/db.js'
import { info, success, warn, section, startProgress, updateProgress, endProgress } from '../utils/logger.js'

export interface CategoryMigrationResult {
  wpToPayloadMap: Map<number, number>
  created: number
  skipped: number
}

interface CategoryRow extends WPTerm {
  term_taxonomy_id: number
  taxonomy: string
}

export async function migrateCategories(payload: Payload): Promise<CategoryMigrationResult> {
  section('Step 2: Migrating Categories')

  const wpToPayloadMap = new Map<number, number>()
  let created = 0
  let skipped = 0

  // Query WordPress categories
  const categories = await query<CategoryRow>(`
    SELECT t.term_id, t.name, t.slug, tt.term_taxonomy_id, tt.taxonomy
    FROM ${wpTable('terms')} t
    JOIN ${wpTable('term_taxonomy')} tt ON t.term_id = tt.term_id
    WHERE tt.taxonomy = 'category'
    ORDER BY t.name
  `)

  info(`Found ${categories.length} categories in WordPress`)

  if (categories.length === 0) {
    warn('No categories found in WordPress database')
    return { wpToPayloadMap, created, skipped }
  }

  startProgress('Categories', categories.length)

  for (const cat of categories) {
    try {
      // Check if category already exists by slug
      const existing = await payload.find({
        collection: 'categories',
        where: {
          slug: { equals: cat.slug },
        },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        wpToPayloadMap.set(cat.term_id, existing.docs[0].id)
        skipped++
        updateProgress(1)
        continue
      }

      // Create new category
      const newCategory = await payload.create({
        collection: 'categories',
        data: {
          title: cat.name,
          slug: cat.slug,
        },
      })

      wpToPayloadMap.set(cat.term_id, newCategory.id)
      created++
      updateProgress(1)
    } catch (err) {
      warn(`Failed to create category: ${cat.name}`, err)
      updateProgress(1)
    }
  }

  endProgress()
  success(`Categories migration complete: ${created} created, ${skipped} skipped`)

  return {
    wpToPayloadMap,
    created,
    skipped,
  }
}
