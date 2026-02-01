/**
 * Fix dates for already imported posts and media
 * Updates createdAt and updatedAt from WordPress timestamps
 *
 * This script:
 * - Reads existing posts and media from Payload
 * - Matches them with WordPress records by slug/filename
 * - Updates createdAt and updatedAt with WordPress timestamps
 * - Uses direct SQL to avoid triggering hooks
 *
 * Usage: npx tsx scripts/fix-dates.ts
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config.js'
import { query, wpTable, closeConnection, type WPPost } from './migrate/utils/db.js'
import { section, info, success, error, warn, startProgress, updateProgress, endProgress, summary } from './migrate/utils/logger.js'

interface FixStats {
  postsUpdated: number
  postsNotFound: number
  postsErrors: number
  mediaUpdated: number
  mediaNotFound: number
  mediaErrors: number
}

async function main() {
  const startTime = Date.now()
  const stats: FixStats = {
    postsUpdated: 0,
    postsNotFound: 0,
    postsErrors: 0,
    mediaUpdated: 0,
    mediaNotFound: 0,
    mediaErrors: 0,
  }

  console.log()
  console.log('╔══════════════════════════════════════════════════════════════╗')
  console.log('║       Fix Dates for Imported Posts and Media                 ║')
  console.log('║       Update createdAt/updatedAt from WordPress               ║')
  console.log('╚══════════════════════════════════════════════════════════════╝')
  console.log()

  try {
    // Initialize Payload
    section('Initializing Payload CMS')
    const payload = await getPayload({ config })
    success('Payload initialized')

    // Fix posts
    section('Fixing Post Dates')
    info('Fetching posts from Payload...')

    const posts = await payload.find({
      collection: 'posts',
      limit: 1000,
      pagination: false,
    })

    info(`Found ${posts.docs.length} posts to process`)

    startProgress('Processing posts', posts.docs.length)

    for (const post of posts.docs) {
      updateProgress(1)

      try {
        // Find matching WordPress post by slug
        const wpPosts = await query<WPPost>(
          `SELECT * FROM ${wpTable('posts')} WHERE post_name = ? AND post_type = 'post' LIMIT 1`,
          [post.slug],
        )

        if (wpPosts.length === 0) {
          stats.postsNotFound++
          warn(`  Post not found in WordPress: ${post.slug}`)
          continue
        }

        const wpPost = wpPosts[0]

        // Convert WordPress dates to ISO strings
        const createdAt = new Date(wpPost.post_date_gmt).toISOString()
        const updatedAt = new Date(wpPost.post_modified_gmt).toISOString()

        // Update using Payload API with disableRevalidate to avoid side effects
        await payload.update({
          collection: 'posts',
          id: post.id,
          data: {
            createdAt: createdAt,
            updatedAt: updatedAt,
          },
          context: {
            disableRevalidate: true,
          },
        })

        stats.postsUpdated++
      } catch (err) {
        stats.postsErrors++
        error(`  Error updating post ${post.slug}:`, err)
      }
    }

    endProgress()
    success(`Updated ${stats.postsUpdated} posts`)

    if (stats.postsNotFound > 0) {
      warn(`${stats.postsNotFound} posts not found in WordPress`)
    }
    if (stats.postsErrors > 0) {
      error(`${stats.postsErrors} posts failed to update`)
    }

    // Fix media
    section('Fixing Media Dates')
    info('Fetching media from Payload...')

    const media = await payload.find({
      collection: 'media',
      limit: 5000,
      pagination: false,
    })

    info(`Found ${media.docs.length} media items to process`)

    startProgress('Processing media', media.docs.length)

    for (const item of media.docs) {
      updateProgress(1)

      try {
        // Find matching WordPress attachment by filename
        // WordPress stores full path in _wp_attached_file meta
        const wpAttachments = await query<WPPost>(
          `
          SELECT p.*
          FROM ${wpTable('posts')} p
          JOIN ${wpTable('postmeta')} pm ON p.ID = pm.post_id AND pm.meta_key = '_wp_attached_file'
          WHERE pm.meta_value LIKE ? AND p.post_type = 'attachment'
          LIMIT 1
          `,
          [`%${item.filename}`],
        )

        if (wpAttachments.length === 0) {
          stats.mediaNotFound++
          // Don't warn for each missing media - too verbose
          continue
        }

        const wpAttachment = wpAttachments[0]

        // Convert WordPress dates to ISO strings
        const createdAt = new Date(wpAttachment.post_date_gmt).toISOString()
        const updatedAt = new Date(wpAttachment.post_modified_gmt).toISOString()

        // Update using Payload API with disableRevalidate to avoid side effects
        await payload.update({
          collection: 'media',
          id: item.id,
          data: {
            createdAt: createdAt,
            updatedAt: updatedAt,
          },
          context: {
            disableRevalidate: true,
          },
        })

        stats.mediaUpdated++
      } catch (err) {
        stats.mediaErrors++
        error(`  Error updating media ${item.filename}:`, err)
      }
    }

    endProgress()
    success(`Updated ${stats.mediaUpdated} media items`)

    if (stats.mediaNotFound > 0) {
      warn(`${stats.mediaNotFound} media items not found in WordPress`)
    }
    if (stats.mediaErrors > 0) {
      error(`${stats.mediaErrors} media items failed to update`)
    }

    // Close database connection
    await closeConnection()

    // Final summary
    const duration = Math.round((Date.now() - startTime) / 1000)

    section('Date Fix Complete')
    summary('Final Results', {
      'Posts Updated': stats.postsUpdated.toString(),
      'Posts Not Found': stats.postsNotFound.toString(),
      'Posts Errors': stats.postsErrors.toString(),
      'Media Updated': stats.mediaUpdated.toString(),
      'Media Not Found': stats.mediaNotFound.toString(),
      'Media Errors': stats.mediaErrors.toString(),
      'Duration': `${duration} seconds`,
    })

    const hasErrors = stats.postsErrors > 0 || stats.mediaErrors > 0
    if (hasErrors) {
      error('\nDate fix completed with errors')
      process.exit(1)
    } else {
      success('\nDate fix completed successfully!')
      process.exit(0)
    }
  } catch (err) {
    error('Date fix failed', err)
    await closeConnection()
    process.exit(1)
  }
}

main()
