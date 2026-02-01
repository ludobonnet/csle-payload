/**
 * Step 3: Migrate WordPress media attachments to Payload
 */

import type { Payload } from 'payload'
import fs from 'fs/promises'
import path from 'path'
import { config } from '../config.js'
import { query, wpTable, type WPPost, type WPPostMeta } from '../utils/db.js'
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

export interface MediaMigrationResult {
  wpIdToPayloadId: Map<number, number>
  wpUrlToPayloadId: Map<string, number>
  featuredImageMap: Map<number, number> // post_id -> attachment_id
  created: number
  skipped: number
  failed: number
}

interface AttachmentRow extends WPPost {
  meta_value?: string
}

/**
 * Get MIME type from file extension
 */
function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
  }
  return mimeTypes[ext] || 'application/octet-stream'
}

/**
 * Check if file type is supported by image-size library
 * These are the only formats that can have imageSizes generated
 */
function isImageSizeSupported(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase()
  const supportedExtensions = [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.svg',
    '.bmp',
    '.tiff',
    '.tif',
    '.ico',
    '.cur',
    '.dds',
    '.icns',
    '.ktx',
    '.psd',
    '.heic',
    '.heif',
    '.avif',
  ]
  return supportedExtensions.includes(ext)
}

/**
 * Retry a function with exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
): Promise<T> {
  const { maxAttempts, initialDelayMs, backoffMultiplier } = config.retry
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err as Error
      if (attempt < maxAttempts) {
        const delay = initialDelayMs * Math.pow(backoffMultiplier, attempt - 1)
        debug(`Retry ${attempt}/${maxAttempts} for ${label}, waiting ${delay}ms`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}

export async function migrateMedia(payload: Payload): Promise<MediaMigrationResult> {
  section('Step 3: Migrating Media')

  const wpIdToPayloadId = new Map<number, number>()
  const wpUrlToPayloadId = new Map<string, number>()
  const featuredImageMap = new Map<number, number>()
  let created = 0
  let skipped = 0
  let failed = 0

  // Query WordPress attachments with their file paths
  const attachments = await query<AttachmentRow>(`
    SELECT p.*, pm.meta_value
    FROM ${wpTable('posts')} p
    LEFT JOIN ${wpTable('postmeta')} pm ON p.ID = pm.post_id AND pm.meta_key = '_wp_attached_file'
    WHERE p.post_type = 'attachment'
    ORDER BY p.post_date ASC
  `)

  info(`Found ${attachments.length} media attachments in WordPress`)

  // Query featured images mapping (post_id -> attachment_id)
  const thumbnails = await query<WPPostMeta>(`
    SELECT post_id, meta_value
    FROM ${wpTable('postmeta')}
    WHERE meta_key = '_thumbnail_id'
  `)

  for (const thumb of thumbnails) {
    featuredImageMap.set(thumb.post_id, parseInt(thumb.meta_value, 10))
  }

  info(`Found ${thumbnails.length} featured image mappings`)

  if (attachments.length === 0) {
    warn('No attachments found in WordPress database')
    return { wpIdToPayloadId, wpUrlToPayloadId, featuredImageMap, created, skipped, failed }
  }

  startProgress('Media', attachments.length)

  // Process in batches
  const batchSize = config.batchSize.media

  for (let i = 0; i < attachments.length; i += batchSize) {
    const batch = attachments.slice(i, i + batchSize)

    await Promise.all(
      batch.map(async (attachment) => {
        try {
          const relativePath = attachment.meta_value || ''
          if (!relativePath) {
            warn(`Attachment ${attachment.ID} has no file path`)
            failed++
            updateProgress(1)
            return
          }

          // Construct filename for idempotency check
          const filename = path.basename(relativePath)

          // Check if media already exists by filename
          const existing = await payload.find({
            collection: 'media',
            where: {
              filename: { equals: filename },
            },
            limit: 1,
          })

          if (existing.docs.length > 0) {
            wpIdToPayloadId.set(attachment.ID, existing.docs[0].id)
            wpUrlToPayloadId.set(relativePath, existing.docs[0].id)
            skipped++
            updateProgress(1)
            return
          }

          // Read file from disk
          const fullPath = path.join(config.mediaBasePath, relativePath)

          try {
            await fs.access(fullPath)
          } catch {
            warn(`File not found: ${fullPath}`)
            failed++
            updateProgress(1)
            return
          }

          // Skip files not supported by image-size (PDF, video, audio, etc.)
          // These would fail because the Media collection has imageSizes configured
          if (!isImageSizeSupported(filename)) {
            debug(`Skipping unsupported file type: ${filename}`)
            skipped++
            updateProgress(1)
            return
          }

          const fileBuffer = await fs.readFile(fullPath)
          const stats = await fs.stat(fullPath)
          const mimeType = attachment.post_mime_type || getMimeType(filename)

          // Upload to Payload with retry
          const newMedia = await withRetry(
            () =>
              payload.create({
                collection: 'media',
                data: {
                  alt: attachment.post_title || filename,
                  createdAt: attachment.post_date_gmt ? new Date(attachment.post_date_gmt).toISOString() : undefined,
                  updatedAt: attachment.post_modified_gmt ? new Date(attachment.post_modified_gmt).toISOString() : undefined,
                },
                file: {
                  name: filename,
                  data: fileBuffer,
                  mimetype: mimeType,
                  size: stats.size,
                },
              }),
            `upload ${filename}`,
          )

          wpIdToPayloadId.set(attachment.ID, newMedia.id)
          wpUrlToPayloadId.set(relativePath, newMedia.id)

          // Also map without year/month prefix for URL matching
          const filenameOnly = path.basename(relativePath)
          wpUrlToPayloadId.set(filenameOnly, newMedia.id)

          created++
          updateProgress(1)
        } catch (err) {
          error(`Failed to migrate attachment ${attachment.ID}`, err)
          failed++
          updateProgress(1)
        }
      }),
    )
  }

  endProgress()
  success(`Media migration complete: ${created} created, ${skipped} skipped, ${failed} failed`)

  return {
    wpIdToPayloadId,
    wpUrlToPayloadId,
    featuredImageMap,
    created,
    skipped,
    failed,
  }
}
