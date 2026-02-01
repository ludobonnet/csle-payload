#!/usr/bin/env npx tsx
/**
 * Fix UTF-8 encoding issues in WordPress media filenames
 *
 * Problem: Files were named with UTF-8 bytes interpreted as Latin-1
 * Example: "bêtes" became "bÃªtes"
 *
 * Solution: Re-encode Latin-1 → UTF-8 to recover original names
 *
 * Usage:
 *   npx tsx scripts/fix-media-encoding.ts          # Dry run (preview changes)
 *   npx tsx scripts/fix-media-encoding.ts --apply  # Apply renames
 */

import fs from 'fs/promises'
import path from 'path'

const MEDIA_PATH =
  process.env.WP_MEDIA_PATH ||
  '/Users/ludobonnet/Projets/csle/sources/wp/wordpress/wp-content/blogs.dir/5/files'

const DRY_RUN = !process.argv.includes('--apply')

interface RenameOperation {
  oldPath: string
  newPath: string
  oldName: string
  newName: string
}

/**
 * Attempt to fix a potentially broken UTF-8 filename
 * Returns null if no fix needed or if conversion fails
 */
function fixEncoding(filename: string): string | null {
  try {
    // Encode the string as Latin-1 to get the raw bytes
    const bytes = Buffer.from(filename, 'latin1')

    // Try to decode as UTF-8
    const fixed = bytes.toString('utf8')

    // Check if it's different and valid
    if (fixed !== filename && !fixed.includes('\ufffd')) {
      return fixed
    }
  } catch {
    // Conversion failed, no fix needed
  }
  return null
}

/**
 * Recursively find all files that need renaming
 */
async function findFilesToRename(dir: string): Promise<RenameOperation[]> {
  const operations: RenameOperation[] = []

  const entries = await fs.readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const oldPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      // Check if directory name needs fixing
      const fixedDirName = fixEncoding(entry.name)
      if (fixedDirName) {
        const newPath = path.join(dir, fixedDirName)
        operations.push({
          oldPath,
          newPath,
          oldName: entry.name,
          newName: fixedDirName,
        })
        // Recurse into the directory with old name (we'll rename after)
        operations.push(...(await findFilesToRename(oldPath)))
      } else {
        // Recurse into directory
        operations.push(...(await findFilesToRename(oldPath)))
      }
    } else {
      // Check if file name needs fixing
      const fixedFileName = fixEncoding(entry.name)
      if (fixedFileName) {
        const newPath = path.join(dir, fixedFileName)
        operations.push({
          oldPath,
          newPath,
          oldName: entry.name,
          newName: fixedFileName,
        })
      }
    }
  }

  return operations
}

/**
 * Apply rename operations (files first, then directories from deepest to shallowest)
 */
async function applyRenames(operations: RenameOperation[]): Promise<void> {
  // Sort: files before directories, deeper paths first
  const sorted = [...operations].sort((a, b) => {
    const aIsDir = !path.extname(a.oldName)
    const bIsDir = !path.extname(b.oldName)
    if (aIsDir !== bIsDir) return aIsDir ? 1 : -1
    return b.oldPath.length - a.oldPath.length
  })

  for (const op of sorted) {
    try {
      // Check if target already exists
      try {
        await fs.access(op.newPath)
        console.log(`⚠️  Skip (target exists): ${op.oldName} → ${op.newName}`)
        continue
      } catch {
        // Target doesn't exist, good to proceed
      }

      await fs.rename(op.oldPath, op.newPath)
      console.log(`✅ Renamed: ${op.oldName} → ${op.newName}`)
    } catch (err) {
      console.error(`❌ Failed: ${op.oldPath}`, err)
    }
  }
}

async function main() {
  console.log('🔍 Scanning for files with encoding issues...')
  console.log(`   Path: ${MEDIA_PATH}`)
  console.log(`   Mode: ${DRY_RUN ? 'DRY RUN (use --apply to rename)' : 'APPLYING CHANGES'}\n`)

  try {
    await fs.access(MEDIA_PATH)
  } catch {
    console.error(`❌ Media path not found: ${MEDIA_PATH}`)
    process.exit(1)
  }

  const operations = await findFilesToRename(MEDIA_PATH)

  if (operations.length === 0) {
    console.log('✅ No files with encoding issues found.')
    return
  }

  console.log(`Found ${operations.length} files/directories to rename:\n`)

  for (const op of operations) {
    const relativePath = path.relative(MEDIA_PATH, path.dirname(op.oldPath))
    const location = relativePath ? `[${relativePath}] ` : ''
    console.log(`   ${location}${op.oldName}`)
    console.log(`   → ${op.newName}\n`)
  }

  if (DRY_RUN) {
    console.log('---')
    console.log('This was a dry run. To apply changes, run:')
    console.log('  npx tsx scripts/fix-media-encoding.ts --apply')
  } else {
    console.log('Applying renames...\n')
    await applyRenames(operations)
    console.log('\n✅ Done!')
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
