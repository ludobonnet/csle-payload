/**
 * WordPress to Payload CMS Migration Script
 *
 * Migrates content from WordPress MariaDB to Payload CMS:
 * - Users (3 authors)
 * - Categories
 * - Tags
 * - Media files (~4345 attachments)
 * - Posts (~547 articles)
 *
 * Usage: pnpm migrate:wp
 *
 * Environment variables:
 * - WP_DB_HOST: WordPress database host (default: 127.0.0.1)
 * - WP_DB_PORT: WordPress database port (default: 3306)
 * - WP_DB_USER: WordPress database user (default: wordpress)
 * - WP_DB_PASSWORD: WordPress database password (default: wordpress)
 * - WP_DB_NAME: WordPress database name (default: wordpress)
 * - WP_MEDIA_PATH: Path to WordPress media files
 * - MIGRATION_DEFAULT_PASSWORD: Default password for created users
 * - DEBUG: Set to 'true' for verbose logging
 */

import 'dotenv/config'
import { writeFileSync } from 'node:fs'
import { getPayload } from 'payload'
import config from '../../src/payload.config.js'
import { closeConnection } from './utils/db.js'
import { section, info, success, error, summary } from './utils/logger.js'

// Migration steps
import { migrateUsers } from './steps/01-users.js'
import { migrateCategories } from './steps/02-categories.js'
import { migrateTags } from './steps/02b-tags.js'
import { migrateMedia } from './steps/03-media.js'
import { migratePosts } from './steps/04-posts.js'
import { verifyMigration } from './steps/05-verify.js'

async function main() {
  const startTime = Date.now()

  console.log()
  console.log('╔══════════════════════════════════════════════════════════════╗')
  console.log('║       WordPress to Payload CMS Migration                     ║')
  console.log('║       CSLE.fr Blog Migration Script                          ║')
  console.log('╚══════════════════════════════════════════════════════════════╝')
  console.log()

  try {
    // Initialize Payload
    section('Initializing Payload CMS')
    const payload = await getPayload({ config })
    success('Payload initialized')

    // Step 1: Migrate users
    const userResult = await migrateUsers(payload)

    // Step 2: Migrate categories
    const categoryResult = await migrateCategories(payload)

    // Step 2b: Migrate tags
    const tagResult = await migrateTags(payload)

    // Step 3: Migrate media
    const mediaResult = await migrateMedia(payload)

    // Step 4: Migrate posts
    const postResult = await migratePosts(
      payload,
      userResult.wpToPayloadMap,
      categoryResult.wpToPayloadMap,
      tagResult.wpToPayloadMap,
      mediaResult.wpIdToPayloadId,
      mediaResult.wpUrlToPayloadId,
      mediaResult.featuredImageMap,
    )

    // Step 5: Verify migration
    const verificationResult = await verifyMigration(payload, {
      users: userResult.created + userResult.skipped,
      categories: categoryResult.created + categoryResult.skipped,
      tags: tagResult.created + tagResult.skipped,
      media: mediaResult.created + mediaResult.skipped,
      posts: postResult.created + postResult.skipped,
    })

    // Close database connection
    await closeConnection()

    // Final summary
    const duration = Math.round((Date.now() - startTime) / 1000)

    section('Migration Complete')
    summary('Final Results', {
      'Users': `${userResult.created} created, ${userResult.skipped} skipped`,
      'Categories': `${categoryResult.created} created, ${categoryResult.skipped} skipped`,
      'Tags': `${tagResult.created} created, ${tagResult.skipped} skipped`,
      'Media': `${mediaResult.created} created, ${mediaResult.skipped} skipped, ${mediaResult.failed} failed`,
      'Posts': `${postResult.created} created, ${postResult.skipped} skipped, ${postResult.failed} failed`,
      'Duration': `${duration} seconds`,
      'Issues': verificationResult.issues.length.toString(),
    })

    // Report conversion errors
    if (postResult.conversionErrors.length > 0) {
      info(`\nConversion errors in ${postResult.conversionErrors.length} posts:`)
      for (const err of postResult.conversionErrors.slice(0, 10)) {
        info(`  - ${err.slug} (WP ID: ${err.wpId}): ${err.errors.join(', ')}`)
      }
      if (postResult.conversionErrors.length > 10) {
        info(`  ... and ${postResult.conversionErrors.length - 10} more`)
      }
      const reportPath = 'scripts/migrate/conversion-report.json'
      writeFileSync(reportPath, JSON.stringify(postResult.conversionErrors, null, 2))
      info(`Rapport complet : ${reportPath}`)
    }

    success('\nMigration completed successfully!')

    // Exit with appropriate code
    const hasErrors = mediaResult.failed > 0 || postResult.failed > 0 || verificationResult.issues.length > 0
    process.exit(hasErrors ? 1 : 0)
  } catch (err) {
    error('Migration failed', err)
    await closeConnection()
    process.exit(1)
  }
}

main()
