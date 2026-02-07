/**
 * WordPress shortcode pre-processing
 * Converts WordPress shortcodes to HTML that can be converted to Lexical
 */

import { warn, debug } from '../utils/logger.js'

interface GalleryResolverFn {
  (ids: number[]): string[]
}

let galleryResolver: GalleryResolverFn | null = null

export function setGalleryResolver(resolver: GalleryResolverFn): void {
  galleryResolver = resolver
}

/**
 * Extract YouTube video ID from various URL formats
 */
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/, // Just the ID
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

/**
 * Extract Vimeo video ID from URL
 */
function extractVimeoId(url: string): string | null {
  const patterns = [/vimeo\.com\/(?:video\/)?(\d+)/, /^(\d+)$/]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

/**
 * Extract Dailymotion video ID from URL
 */
function extractDailymotionId(url: string): string | null {
  const patterns = [/dailymotion\.com\/video\/([a-zA-Z0-9]+)/, /dai\.ly\/([a-zA-Z0-9]+)/, /^([a-zA-Z0-9]+)$/]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

/**
 * Process [youtube] shortcode
 */
function processYouTube(content: string): string {
  // [youtube URL] or [youtube=URL] or [youtube id="ID"]
  const patterns = [
    /\[youtube(?:\s+(?:url=)?["']?([^"'\]]+)["']?)?\]/gi,
    /\[youtube\s+id=["']?([^"'\]]+)["']?\]/gi,
  ]

  for (const pattern of patterns) {
    content = content.replace(pattern, (match, urlOrId) => {
      if (!urlOrId) return ''
      const videoId = extractYouTubeId(urlOrId.trim())
      if (videoId) {
        return `<div data-embed="youtube" data-embed-id="${videoId}" data-embed-url="https://www.youtube.com/watch?v=${videoId}"></div>`
      }
      warn('Could not extract YouTube ID', { match, urlOrId })
      return ''
    })
  }

  return content
}

/**
 * Process [vimeo] shortcode
 */
function processVimeo(content: string): string {
  const pattern = /\[vimeo(?:\s+(?:url=)?["']?([^"'\]]+)["']?)?\]/gi

  return content.replace(pattern, (match, urlOrId) => {
    if (!urlOrId) return ''
    const videoId = extractVimeoId(urlOrId.trim())
    if (videoId) {
      return `<div data-embed="vimeo" data-embed-id="${videoId}" data-embed-url="https://vimeo.com/${videoId}"></div>`
    }
    warn('Could not extract Vimeo ID', { match, urlOrId })
    return ''
  })
}

/**
 * Process [dailymotion] shortcode
 */
function processDailymotion(content: string): string {
  const pattern = /\[dailymotion(?:\s+(?:id=)?["']?([^"'\]]+)["']?)?\]/gi

  return content.replace(pattern, (match, urlOrId) => {
    if (!urlOrId) return ''
    const videoId = extractDailymotionId(urlOrId.trim())
    if (videoId) {
      return `<div data-embed="dailymotion" data-embed-id="${videoId}" data-embed-url="https://www.dailymotion.com/video/${videoId}"></div>`
    }
    warn('Could not extract Dailymotion ID', { match, urlOrId })
    return ''
  })
}

/**
 * Process [caption] shortcode
 */
function processCaption(content: string): string {
  // [caption id="..." align="..." width="..."]<img ... />Caption text[/caption]
  const pattern = /\[caption[^\]]*\]([\s\S]*?)\[\/caption\]/gi

  return content.replace(pattern, (match, innerContent) => {
    // Extract the image and caption text
    const imgMatch = innerContent.match(/<img[^>]+>/i)
    if (!imgMatch) {
      warn('Caption without image', { match })
      return innerContent
    }

    const img = imgMatch[0]
    const captionText = innerContent.replace(img, '').trim()

    return `<figure>${img}${captionText ? `<figcaption>${captionText}</figcaption>` : ''}</figure>`
  })
}

/**
 * Process [gallery] shortcode
 */
function processGallery(content: string): string {
  // [gallery include="1,2,3" ids="1,2,3"]
  const pattern = /\[gallery[^\]]*\]/gi

  return content.replace(pattern, (match) => {
    // Extract ids or include attribute
    const idsMatch = match.match(/(?:ids|include)=["']?([^"'\]]+)["']?/i)
    if (!idsMatch) {
      warn('Gallery without IDs', { match })
      return ''
    }

    const ids = idsMatch[1].split(',').map((id) => parseInt(id.trim(), 10))

    if (galleryResolver) {
      const urls = galleryResolver(ids)
      return urls.map((url) => `<img src="${url}" alt="" />`).join('\n')
    }

    // Fallback: create placeholder images that will be resolved later
    return ids.map((id) => `<img data-wp-attachment-id="${id}" src="" alt="" />`).join('\n')
  })
}

/**
 * Process iframe embeds (YouTube, Vimeo, etc.)
 */
function processIframes(content: string): string {
  // Find iframes and convert them to embed placeholders
  const pattern = /<iframe[^>]*src=["']([^"']+)["'][^>]*><\/iframe>/gi

  return content.replace(pattern, (match, src) => {
    // YouTube
    if (src.includes('youtube.com') || src.includes('youtu.be')) {
      const videoId = extractYouTubeId(src)
      if (videoId) {
        return `<div data-embed="youtube" data-embed-id="${videoId}" data-embed-url="https://www.youtube.com/watch?v=${videoId}"></div>`
      }
    }

    // Vimeo
    if (src.includes('vimeo.com')) {
      const videoId = extractVimeoId(src)
      if (videoId) {
        return `<div data-embed="vimeo" data-embed-id="${videoId}" data-embed-url="https://vimeo.com/${videoId}"></div>`
      }
    }

    // Dailymotion
    if (src.includes('dailymotion.com') || src.includes('dai.ly')) {
      const videoId = extractDailymotionId(src)
      if (videoId) {
        return `<div data-embed="dailymotion" data-embed-id="${videoId}" data-embed-url="https://www.dailymotion.com/video/${videoId}"></div>`
      }
    }

    // Keep other iframes as-is (they'll be stripped or handled differently)
    warn('Unknown iframe embed', { src })
    return match
  })
}

/**
 * Process old Flash object embeds (YouTube, etc.)
 * These were common before HTML5 video
 */
function processObjectEmbeds(content: string): string {
  // Match <object>...<embed src="...">...</object> patterns
  // Also match standalone <embed> tags
  const objectPattern = /<object[^>]*>[\s\S]*?<\/object>/gi
  const embedPattern = /<embed[^>]*src=["']([^"']+)["'][^>]*\/?>/gi

  // First, extract embed src from object tags
  content = content.replace(objectPattern, (match) => {
    // Look for embed or param with src/value containing video URL
    const embedMatch = match.match(/<embed[^>]*src=["']([^"']+)["']/i)
    const paramMatch = match.match(/<param[^>]*value=["']([^"']+)["']/i)
    const src = embedMatch?.[1] || paramMatch?.[1]

    if (!src) {
      debug('Object without extractable src', { match: match.substring(0, 200) })
      return ''
    }

    return processVideoUrl(src, match)
  })

  // Handle standalone embed tags
  content = content.replace(embedPattern, (match, src) => {
    return processVideoUrl(src, match)
  })

  return content
}

/**
 * Create an embed placeholder div
 */
function createEmbedPlaceholder(provider: 'youtube' | 'vimeo' | 'dailymotion', videoId: string, originalUrl: string): string {
  const urls: Record<string, string> = {
    youtube: `https://www.youtube.com/watch?v=${videoId}`,
    vimeo: `https://vimeo.com/${videoId}`,
    dailymotion: `https://www.dailymotion.com/video/${videoId}`,
  }
  return `<div data-embed="${provider}" data-embed-id="${videoId}" data-embed-url="${urls[provider]}"></div>`
}

/**
 * Process naked video URLs (WordPress oEmbed pattern)
 *
 * WordPress converts URLs alone on a line to embedded players via oEmbed.
 * This function detects those naked URLs and converts them to embed placeholders.
 *
 * Rules:
 * - URL alone in a <p> tag → CONVERT
 * - URL in the middle of text → DO NOT CONVERT
 * - URL already in an <a href> → DO NOT CONVERT
 */
function processNakedVideoUrls(content: string): string {
  // Pattern: <p> containing only whitespace and a URL, then </p>
  // This catches WordPress's wpautop behavior which wraps lines in <p> tags
  const paragraphPattern = /<p>\s*(https?:\/\/[^\s<]+)\s*<\/p>/gi

  content = content.replace(paragraphPattern, (match, url) => {
    // YouTube (watch, embed, short URLs)
    const youtubeId = extractYouTubeId(url)
    if (youtubeId) {
      debug('Converted naked YouTube URL', { url, videoId: youtubeId })
      return createEmbedPlaceholder('youtube', youtubeId, url)
    }

    // Vimeo
    const vimeoId = extractVimeoId(url)
    if (vimeoId) {
      debug('Converted naked Vimeo URL', { url, videoId: vimeoId })
      return createEmbedPlaceholder('vimeo', vimeoId, url)
    }

    // Dailymotion
    const dailymotionId = extractDailymotionId(url)
    if (dailymotionId) {
      debug('Converted naked Dailymotion URL', { url, videoId: dailymotionId })
      return createEmbedPlaceholder('dailymotion', dailymotionId, url)
    }

    // Not a recognized video URL, keep as-is
    return match
  })

  // Also handle URLs on their own line without <p> wrapper (edge cases)
  // These could appear in raw content before wpautop processing
  // Match URL at start of line, possibly with trailing whitespace, followed by newline or end
  const linePattern = /^(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|vimeo\.com\/|dailymotion\.com\/video\/|dai\.ly\/)[^\s<]+)\s*$/gim

  content = content.replace(linePattern, (match, url) => {
    const youtubeId = extractYouTubeId(url)
    if (youtubeId) {
      debug('Converted naked YouTube URL (line)', { url, videoId: youtubeId })
      return createEmbedPlaceholder('youtube', youtubeId, url)
    }

    const vimeoId = extractVimeoId(url)
    if (vimeoId) {
      debug('Converted naked Vimeo URL (line)', { url, videoId: vimeoId })
      return createEmbedPlaceholder('vimeo', vimeoId, url)
    }

    const dailymotionId = extractDailymotionId(url)
    if (dailymotionId) {
      debug('Converted naked Dailymotion URL (line)', { url, videoId: dailymotionId })
      return createEmbedPlaceholder('dailymotion', dailymotionId, url)
    }

    return match
  })

  return content
}

/**
 * Process a video URL and convert to embed placeholder
 */
function processVideoUrl(src: string, originalMatch: string): string {
  // YouTube (including old /v/ format)
  if (src.includes('youtube.com') || src.includes('youtu.be')) {
    // Handle old YouTube /v/ URL format: youtube.com/v/VIDEO_ID
    const oldFormatMatch = src.match(/youtube\.com\/v\/([a-zA-Z0-9_-]+)/)
    if (oldFormatMatch) {
      const videoId = oldFormatMatch[1].split(/[&?]/)[0] // Remove query params
      return `<div data-embed="youtube" data-embed-id="${videoId}" data-embed-url="https://www.youtube.com/watch?v=${videoId}"></div>`
    }
    const videoId = extractYouTubeId(src)
    if (videoId) {
      return `<div data-embed="youtube" data-embed-id="${videoId}" data-embed-url="https://www.youtube.com/watch?v=${videoId}"></div>`
    }
  }

  // Vimeo
  if (src.includes('vimeo.com')) {
    const videoId = extractVimeoId(src)
    if (videoId) {
      return `<div data-embed="vimeo" data-embed-id="${videoId}" data-embed-url="https://vimeo.com/${videoId}"></div>`
    }
  }

  // Dailymotion
  if (src.includes('dailymotion.com') || src.includes('dai.ly')) {
    const videoId = extractDailymotionId(src)
    if (videoId) {
      return `<div data-embed="dailymotion" data-embed-id="${videoId}" data-embed-url="https://www.dailymotion.com/video/${videoId}"></div>`
    }
  }

  // Unknown embed - remove it
  debug('Unknown object/embed', { src: src.substring(0, 100) })
  return ''
}

/**
 * Remove unsupported shortcodes
 */
function removeUnsupportedShortcodes(content: string): string {
  // List of shortcodes to remove entirely
  const unsupported = [
    'su_slider',
    'su_carousel',
    'su_custom_gallery',
    'su_heading',
    'su_button',
    'su_box',
    'su_note',
    'su_highlight',
    'su_label',
    'su_quote',
    'su_pullquote',
    'su_dropcap',
    'su_frame',
    'su_row',
    'su_column',
    'su_spacer',
    'su_divider',
    'su_accordion',
    'su_spoiler',
    'su_tabs',
    'su_tab',
    'nggallery',
    'slideshow',
  ]

  for (const shortcode of unsupported) {
    // Self-closing: [shortcode attr="value"]
    const selfClosing = new RegExp(`\\[${shortcode}[^\\]]*\\]`, 'gi')
    content = content.replace(selfClosing, (match) => {
      debug(`Removed shortcode: ${shortcode}`, { match })
      return ''
    })

    // With content: [shortcode]...[/shortcode]
    const withContent = new RegExp(`\\[${shortcode}[^\\]]*\\][\\s\\S]*?\\[\\/${shortcode}\\]`, 'gi')
    content = content.replace(withContent, (match) => {
      debug(`Removed shortcode: ${shortcode}`, { match })
      return ''
    })
  }

  return content
}

/**
 * Process all shortcodes in content
 */
export function processShortcodes(content: string): string {
  // Order matters - process nested shortcodes from inside out

  // First: Handle naked video URLs (WordPress oEmbed pattern)
  // These are URLs alone on a line that WordPress auto-embeds
  content = processNakedVideoUrls(content)

  // Then: Process explicit shortcodes
  content = processCaption(content)
  content = processGallery(content)
  content = processYouTube(content)
  content = processVimeo(content)
  content = processDailymotion(content)
  content = processIframes(content)
  content = processObjectEmbeds(content) // Handle old Flash embeds
  content = removeUnsupportedShortcodes(content)

  return content
}
