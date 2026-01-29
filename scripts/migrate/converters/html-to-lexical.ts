/**
 * HTML to Lexical JSON converter
 * Uses Payload's built-in converter with custom pre/post processing
 */

import type { SerializedEditorState, SerializedLexicalNode } from '@payloadcms/richtext-lexical/lexical'
import { createHeadlessEditor } from '@payloadcms/richtext-lexical/lexical/headless'
import {
  $convertFromMarkdownString,
  TRANSFORMERS,
} from '@payloadcms/richtext-lexical/lexical/markdown'
import { $generateNodesFromDOM } from '@payloadcms/richtext-lexical/lexical/html'
import { $getRoot, $insertNodes, type LexicalEditor } from '@payloadcms/richtext-lexical/lexical'
import { JSDOM } from 'jsdom'

import { processShortcodes, setGalleryResolver } from './shortcodes.js'
import { wpautop } from './wpautop.js'
import { debug, warn } from '../utils/logger.js'

// Types for Lexical nodes
interface SerializedBlockNode extends SerializedLexicalNode {
  type: 'block'
  fields: {
    blockType: string
    [key: string]: unknown
  }
}

// Map from WP attachment ID to Payload media ID
let mediaIdMapping: Map<number, number> = new Map()
// Map from WP URL path to Payload media ID
let mediaUrlMapping: Map<string, number> = new Map()

export function setMediaMappings(
  idMap: Map<number, number>,
  urlMap: Map<string, number>,
): void {
  mediaIdMapping = idMap
  mediaUrlMapping = urlMap

  // Set up gallery resolver
  setGalleryResolver((ids: number[]) => {
    return ids
      .map((id) => {
        const payloadId = mediaIdMapping.get(id)
        if (payloadId) {
          return `/media/${payloadId}` // Placeholder, will be resolved in post-processing
        }
        return null
      })
      .filter((url): url is string => url !== null)
  })
}

/**
 * Extract WordPress attachment ID from image URL or data attribute
 */
function extractWPAttachmentId(img: Element): number | null {
  // Check data attribute first
  const dataId = img.getAttribute('data-wp-attachment-id')
  if (dataId) {
    return parseInt(dataId, 10)
  }

  // Check class for wp-image-{id}
  const classAttr = img.getAttribute('class') || ''
  const classMatch = classAttr.match(/wp-image-(\d+)/)
  if (classMatch) {
    return parseInt(classMatch[1], 10)
  }

  return null
}

/**
 * Try to resolve image URL to Payload media ID
 */
function resolveMediaId(src: string, wpAttachmentId: number | null): number | null {
  // Try WP attachment ID first
  if (wpAttachmentId && mediaIdMapping.has(wpAttachmentId)) {
    return mediaIdMapping.get(wpAttachmentId)!
  }

  // Try URL matching
  // Normalize URL - extract path after uploads directory
  const urlPath = src.replace(/^https?:\/\/[^/]+/, '').replace(/.*\/files\//, '')
  if (mediaUrlMapping.has(urlPath)) {
    return mediaUrlMapping.get(urlPath)!
  }

  // Try without size suffix (-300x200, etc)
  const withoutSize = urlPath.replace(/-\d+x\d+\./, '.')
  if (mediaUrlMapping.has(withoutSize)) {
    return mediaUrlMapping.get(withoutSize)!
  }

  return null
}

/**
 * Create a Lexical block node for media
 */
function createMediaBlockNode(mediaId: number): SerializedBlockNode {
  return {
    type: 'block',
    version: 1,
    fields: {
      blockType: 'mediaBlock',
      media: mediaId,
    },
  }
}

/**
 * Create a Lexical block node for embed
 */
function createEmbedBlockNode(
  provider: 'youtube' | 'vimeo' | 'dailymotion',
  embedId: string,
  url: string,
): SerializedBlockNode {
  return {
    type: 'block',
    version: 1,
    fields: {
      blockType: 'embed',
      provider,
      embedId,
      url,
    },
  }
}

/**
 * Post-process Lexical JSON to convert placeholders to blocks
 */
function postProcessLexical(
  state: SerializedEditorState,
  unresolvedImages: Array<{ src: string; wpId: number | null }>,
): SerializedEditorState {
  // Track unresolved images for reporting
  const processNode = (node: SerializedLexicalNode): SerializedLexicalNode | SerializedLexicalNode[] => {
    // Handle image nodes - convert to media blocks
    if (node.type === 'image') {
      const imageNode = node as SerializedLexicalNode & {
        src?: string
        altText?: string
      }
      const src = imageNode.src || ''
      const wpId = extractWPAttachmentIdFromSrc(src)
      const mediaId = resolveMediaId(src, wpId)

      if (mediaId) {
        return createMediaBlockNode(mediaId)
      }

      // Track unresolved
      unresolvedImages.push({ src, wpId })
      debug('Unresolved image', { src, wpId })
      // Keep as-is, will render as broken image
      return node
    }

    // Handle paragraph nodes that might contain only embed placeholders
    if (node.type === 'paragraph') {
      const paraNode = node as SerializedLexicalNode & {
        children?: SerializedLexicalNode[]
      }

      if (paraNode.children?.length === 1) {
        const child = paraNode.children[0]
        if (child.type === 'linebreak') {
          // Empty paragraph with just linebreak - keep as-is
          return node
        }
      }
    }

    // Recursively process children
    if ('children' in node && Array.isArray((node as { children?: unknown[] }).children)) {
      const typedNode = node as SerializedLexicalNode & { children: SerializedLexicalNode[] }
      const newChildren: SerializedLexicalNode[] = []

      for (const child of typedNode.children) {
        const processed = processNode(child)
        if (Array.isArray(processed)) {
          newChildren.push(...processed)
        } else {
          newChildren.push(processed)
        }
      }

      return {
        ...node,
        children: newChildren,
      } as SerializedLexicalNode
    }

    return node
  }

  // Process root children
  const rootChildren = state.root.children || []
  const newChildren: SerializedLexicalNode[] = []

  for (const child of rootChildren) {
    const processed = processNode(child)
    if (Array.isArray(processed)) {
      newChildren.push(...processed)
    } else {
      newChildren.push(processed)
    }
  }

  return {
    ...state,
    root: {
      ...state.root,
      children: newChildren,
    },
  }
}

function extractWPAttachmentIdFromSrc(src: string): number | null {
  // Check for wp-image class pattern in src (sometimes embedded)
  const match = src.match(/wp-content\/uploads\/.*?(\d+)/)
  return match ? parseInt(match[1], 10) : null
}

/**
 * Pre-process HTML before Lexical conversion
 */
function preprocessHTML(html: string): string {
  // Process WordPress shortcodes
  html = processShortcodes(html)

  // Apply wpautop for proper paragraph handling
  html = wpautop(html)

  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '')

  // Convert embed placeholders to a format Lexical can parse
  // These will be handled in post-processing

  return html
}

/**
 * Convert embed placeholder divs to block nodes
 */
function processEmbedPlaceholders(
  html: string,
): { html: string; embeds: Array<{ placeholder: string; node: SerializedBlockNode }> } {
  const embeds: Array<{ placeholder: string; node: SerializedBlockNode }> = []
  let index = 0

  const processedHtml = html.replace(
    /<div\s+data-embed="([^"]+)"\s+data-embed-id="([^"]+)"\s+data-embed-url="([^"]+)"[^>]*><\/div>/gi,
    (match, provider, embedId, url) => {
      const placeholder = `__EMBED_PLACEHOLDER_${index++}__`
      const node = createEmbedBlockNode(
        provider as 'youtube' | 'vimeo' | 'dailymotion',
        embedId,
        url,
      )
      embeds.push({ placeholder, node })
      return `<p>${placeholder}</p>`
    },
  )

  return { html: processedHtml, embeds }
}

/**
 * Insert embed blocks into Lexical state
 */
function insertEmbedBlocks(
  state: SerializedEditorState,
  embeds: Array<{ placeholder: string; node: SerializedBlockNode }>,
): SerializedEditorState {
  if (embeds.length === 0) return state

  const processNode = (node: SerializedLexicalNode): SerializedLexicalNode | SerializedBlockNode => {
    // Check if this is a text node containing a placeholder
    if (node.type === 'text') {
      const textNode = node as SerializedLexicalNode & { text?: string }
      for (const embed of embeds) {
        if (textNode.text?.includes(embed.placeholder)) {
          // Replace with embed block
          return embed.node
        }
      }
    }

    // Check paragraphs that might contain only a placeholder
    if (node.type === 'paragraph') {
      const paraNode = node as SerializedLexicalNode & { children?: SerializedLexicalNode[] }
      if (paraNode.children?.length === 1) {
        const child = paraNode.children[0]
        if (child.type === 'text') {
          const textChild = child as SerializedLexicalNode & { text?: string }
          for (const embed of embeds) {
            if (textChild.text?.trim() === embed.placeholder) {
              return embed.node
            }
          }
        }
      }
    }

    // Recursively process children
    if ('children' in node && Array.isArray((node as { children?: unknown[] }).children)) {
      const typedNode = node as SerializedLexicalNode & { children: SerializedLexicalNode[] }
      return {
        ...node,
        children: typedNode.children.map((child) => processNode(child)),
      } as SerializedLexicalNode
    }

    return node
  }

  return {
    ...state,
    root: {
      ...state.root,
      children: state.root.children.map((child) => processNode(child)),
    },
  }
}

// Type alias for the Lexical content structure used by Payload
type LexicalContent = {
  root: {
    type: string
    version: number
    direction: 'ltr' | 'rtl' | null
    format: '' | 'left' | 'start' | 'center' | 'right' | 'end' | 'justify'
    indent: number
    children: unknown[]
  }
}

/**
 * Check if Lexical content is effectively empty (no actual text or meaningful content)
 */
export function isLexicalContentEmpty(lexical: LexicalContent): boolean {
  const hasContent = (children: unknown[]): boolean => {
    for (const child of children) {
      if (typeof child !== 'object' || child === null) continue
      const node = child as Record<string, unknown>

      // Check for text content
      if (node.type === 'text' && typeof node.text === 'string' && node.text.trim()) {
        return true
      }

      // Check for block nodes (media, embed, etc.)
      if (node.type === 'block') {
        return true
      }

      // Check for images
      if (node.type === 'image') {
        return true
      }

      // Recursively check children
      if (Array.isArray(node.children) && hasContent(node.children)) {
        return true
      }
    }
    return false
  }

  return !hasContent(lexical.root.children)
}

/**
 * Convert WordPress HTML content to Lexical JSON
 */
export async function convertHtmlToLexical(html: string): Promise<{
  lexical: LexicalContent
  unresolvedImages: Array<{ src: string; wpId: number | null }>
}> {
  const unresolvedImages: Array<{ src: string; wpId: number | null }> = []

  // Skip empty content
  if (!html || html.trim() === '') {
    return {
      lexical: {
        root: {
          type: 'root',
          version: 1,
          direction: 'ltr',
          format: '',
          indent: 0,
          children: [
            {
              type: 'paragraph',
              version: 1,
              direction: 'ltr',
              format: '',
              indent: 0,
              textFormat: 0,
              children: [],
            },
          ],
        },
      },
      unresolvedImages,
    }
  }

  // Pre-process HTML
  let processedHtml = preprocessHTML(html)

  // Extract embed placeholders
  const { html: htmlWithPlaceholders, embeds } = processEmbedPlaceholders(processedHtml)
  processedHtml = htmlWithPlaceholders

  // Create JSDOM instance
  const dom = new JSDOM(`<!DOCTYPE html><body>${processedHtml}</body>`)
  const document = dom.window.document

  // Create headless Lexical editor
  const editor = createHeadlessEditor({
    nodes: [],
    onError: (error: Error) => {
      warn('Lexical error during conversion', error.message)
    },
  })

  // Convert HTML to Lexical nodes
  let editorState: SerializedEditorState | null = null

  await new Promise<void>((resolve) => {
    editor.update(
      () => {
        const nodes = $generateNodesFromDOM(editor, document)
        const root = $getRoot()
        root.clear()
        $insertNodes(nodes)
      },
      { discrete: true },
    )

    editorState = editor.getEditorState().toJSON()
    resolve()
  })

  if (!editorState) {
    throw new Error('Failed to convert HTML to Lexical')
  }

  // Insert embed blocks
  editorState = insertEmbedBlocks(editorState, embeds)

  // Post-process to convert images to media blocks
  editorState = postProcessLexical(editorState, unresolvedImages)

  return {
    lexical: editorState as unknown as LexicalContent,
    unresolvedImages,
  }
}
