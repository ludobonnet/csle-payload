import type { Payload, RichTextField } from 'payload'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import {
  convertLexicalToMarkdown,
  convertMarkdownToLexical,
  editorConfigFactory,
} from '@payloadcms/richtext-lexical'

// Config réelle de l'éditeur du champ `content` des articles : la conversion
// n'accepte que ce que l'éditeur sait afficher (intertitres, citations, listes, liens…).
const postsEditorConfig = (payload: Payload) => {
  const field = payload.collections.posts.config.flattenedFields.find(
    (f) => f.name === 'content' && f.type === 'richText',
  ) as RichTextField | undefined
  if (!field) throw new Error('Champ `content` introuvable sur la collection posts')
  return editorConfigFactory.fromField({ field })
}

export const markdownToLexical = (payload: Payload, markdown: string): SerializedEditorState =>
  convertMarkdownToLexical({ editorConfig: postsEditorConfig(payload), markdown })

export const lexicalToMarkdown = (payload: Payload, data: SerializedEditorState): string =>
  convertLexicalToMarkdown({ data, editorConfig: postsEditorConfig(payload) })

type LexicalNode = { type?: string; fields?: { blockType?: string }; children?: LexicalNode[] }

// Images (`mediaBlock`) et vidéos (`embed`) n'ont pas d'équivalent Markdown :
// on les compte pour ne jamais les écraser par une réécriture en Markdown.
export const countBlocks = (data: unknown): Record<string, number> => {
  const counts: Record<string, number> = {}
  const walk = (node: LexicalNode | undefined) => {
    if (!node) return
    if (node.type === 'block' || node.type === 'inlineBlock') {
      const key = node.fields?.blockType ?? 'inconnu'
      counts[key] = (counts[key] ?? 0) + 1
    }
    node.children?.forEach(walk)
  }
  walk((data as { root?: LexicalNode } | null)?.root)
  return counts
}
