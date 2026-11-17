/** Vitesse de lecture d'un texte en français à l'écran, en mots par minute. */
const WORDS_PER_MINUTE = 230

type LexicalNode = { type?: string; text?: string; children?: LexicalNode[] }

function countWords(node: LexicalNode | undefined): number {
  if (!node) return 0
  const own = node.text ? node.text.split(/\s+/).filter(Boolean).length : 0
  return own + (node.children?.reduce((sum, child) => sum + countWords(child), 0) ?? 0)
}

/** Temps de lecture estimé d'un contenu Lexical, en minutes (au moins 1). */
export function readingTime(content: { root?: LexicalNode } | null | undefined): number {
  return Math.max(1, Math.round(countWords(content?.root) / WORDS_PER_MINUTE))
}
