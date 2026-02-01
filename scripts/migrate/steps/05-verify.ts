/**
 * Step 5: Verify migration results
 */

import type { Payload } from 'payload'
import { section, info, success, warn, summary } from '../utils/logger.js'

interface VerificationResult {
  collections: Record<string, { count: number; expected?: number }>
  issues: string[]
  samples: Array<{
    slug: string
    hasAuthor: boolean
    hasCategories: boolean
    hasHeroImage: boolean
  }>
}

export async function verifyMigration(
  payload: Payload,
  expectedCounts: {
    users?: number
    categories?: number
    tags?: number
    media?: number
    posts?: number
  },
): Promise<VerificationResult> {
  section('Step 5: Verification')

  const issues: string[] = []
  const collections: Record<string, { count: number; expected?: number }> = {}

  // Count documents in each collection
  const collectionNames = ['users', 'categories', 'tags', 'media', 'posts'] as const

  for (const collName of collectionNames) {
    try {
      const result = await payload.count({
        collection: collName,
      })

      collections[collName] = {
        count: result.totalDocs,
        expected: expectedCounts[collName],
      }

      if (expectedCounts[collName] !== undefined && result.totalDocs < expectedCounts[collName]) {
        issues.push(
          `${collName}: Expected ${expectedCounts[collName]}, got ${result.totalDocs}`,
        )
      }
    } catch (err) {
      warn(`Failed to count ${collName}`, err)
      collections[collName] = { count: -1 }
    }
  }

  // Print collection counts
  summary('Collection Counts', {
    users: `${collections.users?.count || 0}${collections.users?.expected ? ` (expected: ${collections.users.expected})` : ''}`,
    categories: `${collections.categories?.count || 0}${collections.categories?.expected ? ` (expected: ${collections.categories.expected})` : ''}`,
    tags: `${collections.tags?.count || 0}${collections.tags?.expected ? ` (expected: ${collections.tags.expected})` : ''}`,
    media: `${collections.media?.count || 0}${collections.media?.expected ? ` (expected: ${collections.media.expected})` : ''}`,
    posts: `${collections.posts?.count || 0}${collections.posts?.expected ? ` (expected: ${collections.posts.expected})` : ''}`,
  })

  // Sample 10 random posts for detailed verification
  info('Sampling 10 posts for detailed verification...')

  const samplePosts = await payload.find({
    collection: 'posts',
    limit: 10,
    sort: '-createdAt',
    depth: 1,
  })

  const samples = samplePosts.docs.map((post) => {
    const hasAuthor = Array.isArray(post.authors) && post.authors.length > 0
    const hasCategories = Array.isArray(post.categories) && post.categories.length > 0
    const hasHeroImage = post.heroImage !== null && post.heroImage !== undefined

    if (!hasAuthor) {
      issues.push(`Post "${post.slug}" has no author`)
    }

    return {
      slug: post.slug,
      hasAuthor,
      hasCategories,
      hasHeroImage,
    }
  })

  // Log sample results
  info('Sample verification:')
  for (const sample of samples) {
    const status = [
      sample.hasAuthor ? '✓ author' : '✗ author',
      sample.hasCategories ? '✓ categories' : '○ categories',
      sample.hasHeroImage ? '✓ hero' : '○ hero',
    ].join(', ')
    info(`  ${sample.slug}: ${status}`)
  }

  // Find posts without hero images
  const postsWithoutHero = await payload.find({
    collection: 'posts',
    where: {
      heroImage: { exists: false },
    },
    limit: 100,
  })

  if (postsWithoutHero.totalDocs > 0) {
    info(`${postsWithoutHero.totalDocs} posts without hero image`)
    if (postsWithoutHero.totalDocs <= 10) {
      for (const post of postsWithoutHero.docs) {
        info(`  - ${post.slug}`)
      }
    }
  }

  // Find posts without categories
  const postsWithoutCategories = await payload.find({
    collection: 'posts',
    where: {
      or: [
        { categories: { exists: false } },
        { categories: { equals: [] } },
      ],
    },
    limit: 100,
  })

  if (postsWithoutCategories.totalDocs > 0) {
    warn(`${postsWithoutCategories.totalDocs} posts without categories`)
  }

  // Find orphan media (uploaded but not referenced)
  // This is expensive, so we just report the total count
  const totalMedia = collections.media?.count || 0
  info(`Total media items: ${totalMedia}`)

  // Summary
  if (issues.length > 0) {
    warn(`Found ${issues.length} issues:`)
    for (const issue of issues.slice(0, 20)) {
      warn(`  - ${issue}`)
    }
    if (issues.length > 20) {
      warn(`  ... and ${issues.length - 20} more`)
    }
  } else {
    success('No critical issues found')
  }

  return {
    collections,
    issues,
    samples,
  }
}
