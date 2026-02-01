/**
 * Replicates WordPress wpautop() function
 * Converts double line breaks to paragraphs and single line breaks to <br>
 */

// Block-level elements that should not be wrapped in <p>
const blockElements = [
  'table',
  'thead',
  'tfoot',
  'caption',
  'col',
  'colgroup',
  'tbody',
  'tr',
  'td',
  'th',
  'div',
  'dl',
  'dd',
  'dt',
  'ul',
  'ol',
  'li',
  'pre',
  'form',
  'map',
  'area',
  'blockquote',
  'address',
  'math',
  'style',
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'fieldset',
  'legend',
  'section',
  'article',
  'aside',
  'hgroup',
  'header',
  'footer',
  'nav',
  'figure',
  'figcaption',
  'details',
  'menu',
  'summary',
  'iframe',
  'object',
  'embed',
  'video',
  'audio',
]

const allBlocks = blockElements.join('|')

/**
 * Replaces double line breaks with paragraph elements
 */
export function wpautop(text: string, br = true): string {
  if (text.trim() === '') {
    return ''
  }

  // Standardize newlines
  text = text.replace(/\r\n|\r/g, '\n')

  // If there are no double line breaks, don't auto-p
  if (!text.includes('\n\n')) {
    // Still convert single newlines to <br> if br is true
    if (br) {
      text = text.replace(/\n/g, '<br />\n')
    }
    return text
  }

  // Replace placeholders for special cases
  const preTags: string[] = []
  text = text.replace(/<pre[^>]*>[\s\S]*?<\/pre>/gi, (match) => {
    preTags.push(match)
    return `\x00pre${preTags.length - 1}\x00`
  })

  const scriptTags: string[] = []
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, (match) => {
    scriptTags.push(match)
    return `\x00script${scriptTags.length - 1}\x00`
  })

  const styleTags: string[] = []
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, (match) => {
    styleTags.push(match)
    return `\x00style${styleTags.length - 1}\x00`
  })

  // Add a double line break above and below block elements
  const blockRegex = new RegExp(`(<(?:${allBlocks})[^>]*>)`, 'gi')
  text = text.replace(blockRegex, '\n\n$1')

  const closeBlockRegex = new RegExp(`(</(?:${allBlocks})>)`, 'gi')
  text = text.replace(closeBlockRegex, '$1\n\n')

  // Standardize newlines again
  text = text.replace(/\n\n+/g, '\n\n')

  // Split on double line breaks
  const paragraphs = text.split(/\n\s*\n/)

  // Wrap each piece in <p> tags if it's not already a block element
  text = paragraphs
    .map((p) => {
      p = p.trim()
      if (p === '') return ''

      // Check if this paragraph starts with a block element
      const startsWithBlock = new RegExp(`^<(?:${allBlocks})[\\s>]`, 'i').test(p)
      if (startsWithBlock) {
        return p
      }

      return `<p>${p}</p>`
    })
    .filter((p) => p !== '')
    .join('\n')

  // Convert single line breaks to <br> inside paragraphs
  if (br) {
    text = text.replace(/<p>([^<]+)<\/p>/g, (match, content) => {
      return `<p>${content.replace(/\n/g, '<br />\n')}</p>`
    })
  }

  // Remove <p> tags around block elements
  const unwrapRegex = new RegExp(`<p>\\s*(<(?:${allBlocks})[^>]*>)`, 'gi')
  text = text.replace(unwrapRegex, '$1')

  const unwrapCloseRegex = new RegExp(`(</(?:${allBlocks})>)\\s*</p>`, 'gi')
  text = text.replace(unwrapCloseRegex, '$1')

  // Restore pre, script, style tags
  text = text.replace(/\x00pre(\d+)\x00/g, (_, index) => preTags[parseInt(index)])
  text = text.replace(/\x00script(\d+)\x00/g, (_, index) => scriptTags[parseInt(index)])
  text = text.replace(/\x00style(\d+)\x00/g, (_, index) => styleTags[parseInt(index)])

  return text
}
