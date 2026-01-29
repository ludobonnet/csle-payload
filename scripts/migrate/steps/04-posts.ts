/**
 * Step 4: Migrate WordPress posts to Payload
 */

import type { Payload } from 'payload'
import { decode } from 'html-entities'
import { query, wpTable, type WPPost, type WPTermRelationship } from '../utils/db.js'
import { convertHtmlToLexical, setMediaMappings, isLexicalContentEmpty } from '../converters/html-to-lexical.js'
import { config } from '../config.js'
import {
  info,
  success,
  warn,
  error,
  debug,
  section,
  startProgress,
  updateProgress,
  endProgress,
} from '../utils/logger.js'

/**
 * Generate a slug from a title
 */
function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '') // Trim hyphens from start/end
    .substring(0, 100) // Limit length
}

export interface PostMigrationResult {
  created: number
  skipped: number
  failed: number
  conversionErrors: Array<{ wpId: number; slug: string; errors: string[] }>
}

interface TermRelationshipRow {
  object_id: number
  term_id: number
  taxonomy: string
}

export async function migratePosts(
  payload: Payload,
  userMap: Map<number, number>,
  categoryMap: Map<number, number>,
  tagMap: Map<number, number>,
  mediaIdMap: Map<number, number>,
  mediaUrlMap: Map<string, number>,
  featuredImageMap: Map<number, number>,
): Promise<PostMigrationResult> {
  section('Step 4: Migrating Posts')

  // Set up media mappings for the HTML converter
  setMediaMappings(mediaIdMap, mediaUrlMap)

  let created = 0
  let skipped = 0
  let failed = 0
  const conversionErrors: Array<{ wpId: number; slug: string; errors: string[] }> = []

  // Query WordPress posts (only published)
  const posts = await query<WPPost>(`
    SELECT *
    FROM ${wpTable('posts')}
    WHERE post_type = 'post'
      AND post_status = 'publish'
    ORDER BY post_date ASC
  `)

  info(`Found ${posts.length} posts in WordPress`)

  // Query all term relationships at once for efficiency
  const termRelationships = await query<TermRelationshipRow>(`
    SELECT tr.object_id, t.term_id, tt.taxonomy
    FROM ${wpTable('term_relationships')} tr
    JOIN ${wpTable('term_taxonomy')} tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
    JOIN ${wpTable('terms')} t ON tt.term_id = t.term_id
    WHERE tt.taxonomy IN ('category', 'post_tag')
  `)

  // Build lookup maps for post -> categories/tags
  const postCategories = new Map<number, number[]>()
  const postTags = new Map<number, number[]>()

  for (const rel of termRelationships) {
    if (rel.taxonomy === 'category') {
      const cats = postCategories.get(rel.object_id) || []
      cats.push(rel.term_id)
      postCategories.set(rel.object_id, cats)
    } else if (rel.taxonomy === 'post_tag') {
      const tags = postTags.get(rel.object_id) || []
      tags.push(rel.term_id)
      postTags.set(rel.object_id, tags)
    }
  }

  if (posts.length === 0) {
    warn('No posts found in WordPress database')
    return { created, skipped, failed, conversionErrors }
  }

  startProgress('Posts', posts.length)

  // Process posts in batches
  const batchSize = config.batchSize.posts

  for (let i = 0; i < posts.length; i += batchSize) {
    const batch = posts.slice(i, i + batchSize)

    for (const post of batch) {
      // Declare slug outside try so it's available in catch
      let slug = post.post_name || ''
      try {
        // Generate slug if missing
        if (!slug || slug.trim() === '') {
          slug = slugify(decode(post.post_title))
          if (!slug) {
            warn(`Post ${post.ID} has no slug and title cannot be slugified, skipping`)
            skipped++
            updateProgress(1)
            continue
          }
          debug(`Generated slug for post ${post.ID}: ${slug}`)
        }

        // Check if post already exists by slug
        const existing = await payload.find({
          collection: 'posts',
          where: {
            slug: { equals: slug },
          },
          limit: 1,
        })

        if (existing.docs.length > 0) {
          skipped++
          updateProgress(1)
          continue
        }

        // Convert HTML content to Lexical
        const { lexical, unresolvedImages } = await convertHtmlToLexical(post.post_content)

        // Check if content is effectively empty
        if (isLexicalContentEmpty(lexical)) {
          warn(`Post ${post.ID} (${slug}) has empty content after conversion, skipping`)
          conversionErrors.push({
            wpId: post.ID,
            slug: slug,
            errors: ['Content is empty after HTML conversion'],
          })
          skipped++
          updateProgress(1)
          continue
        }

        // Track conversion errors
        if (unresolvedImages.length > 0) {
          conversionErrors.push({
            wpId: post.ID,
            slug: slug,
            errors: unresolvedImages.map((img) => `Unresolved image: ${img.src}`),
          })
        }

        // Map author
        const authorId = userMap.get(post.post_author)
        const authors = authorId ? [authorId] : []

        // Map categories
        const wpCatIds = postCategories.get(post.ID) || []
        const categories = wpCatIds
          .map((wpId) => categoryMap.get(wpId))
          .filter((id): id is number => id !== undefined)

        // Map tags
        const wpTagIds = postTags.get(post.ID) || []
        const tags = wpTagIds
          .map((wpId) => tagMap.get(wpId))
          .filter((id): id is number => id !== undefined)

        // Map featured image
        const wpFeaturedId = featuredImageMap.get(post.ID)
        const heroImage = wpFeaturedId ? mediaIdMap.get(wpFeaturedId) : undefined

        // Determine status
        const status = post.post_status === 'publish' ? 'published' : 'draft'

        // Create post in Payload
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newPost = await payload.create({
          collection: 'posts',
          data: {
            title: decode(post.post_title),
            slug: slug,
            // Cast to any to work around strict Lexical type checking in migration script
            content: lexical as any,
            heroImage: heroImage || undefined,
            authors,
            categories,
            tags,
            publishedAt: post.post_date_gmt ? new Date(post.post_date_gmt).toISOString() : undefined,
            _status: status,
            meta: {
              title: decode(post.post_title),
              description: post.post_excerpt ? decode(post.post_excerpt) : undefined,
            },
          },
          context: {
            disableRevalidate: true, // Skip Next.js revalidation during migration
          },
        })

        debug(`Created post: ${slug} (ID: ${newPost.id})`)
        created++
        updateProgress(1)
      } catch (err) {
        error(`Failed to migrate post ${post.ID} (${slug})`, err)
        failed++
        conversionErrors.push({
          wpId: post.ID,
          slug: slug,
          errors: [(err as Error).message],
        })
        updateProgress(1)
      }
    }
  }

  endProgress()
  success(`Posts migration complete: ${created} created, ${skipped} skipped, ${failed} failed`)

  if (conversionErrors.length > 0) {
    warn(`${conversionErrors.length} posts had conversion issues`)
  }

  return {
    created,
    skipped,
    failed,
    conversionErrors,
  }
}
