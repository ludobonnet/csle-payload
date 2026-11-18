/**
 * Rétablit les intertitres d'un contenu Lexical : un paragraphe de premier niveau dont le
 * texte est exactement celui d'un intertitre WordPress devient un nœud « heading ». Rien
 * d'autre n'est touché (photos, vidéos, liens, corrections faites depuis la migration).
 * Les intertitres sont cherchés dans l'ordre du texte ; un intertitre introuvable est sauté.
 */

type LexicalNode = {
  type?: string
  text?: string
  format?: number | string
  children?: LexicalNode[]
  [key: string]: unknown
}

export type Intertitre = { tag: 'h2' | 'h3' | 'h4'; text: string }

/** Comparaison tolérante aux espaces insécables, apostrophes typographiques et guillemets. */
export const normalizeText = (text: string) =>
  text
    .replace(/[  \s]+/g, ' ')
    .replace(/[’‘`]/g, "'")
    .replace(/[“”«»]/g, '"')
    .replace(/[–—]/g, '-')
    .trim()

const plainText = (node: LexicalNode): string =>
  node.type === 'linebreak'
    ? ' '
    : (node.text ?? '') + (node.children ?? []).map(plainText).join('')

/** Gras retiré des enfants : un intertitre est déjà en graisse de titre. */
const withoutBold = (node: LexicalNode): LexicalNode => ({
  ...node,
  ...(typeof node.format === 'number' && node.type === 'text' ? { format: node.format & ~1 } : {}),
  ...(node.children ? { children: node.children.map(withoutBold) } : {}),
})

export function applyIntertitres<T extends { root?: LexicalNode }>(
  content: T,
  intertitres: Intertitre[],
): { content: T; converted: number } {
  const children = content?.root?.children
  if (!children || intertitres.length === 0) return { content, converted: 0 }

  const wanted = intertitres.map((intertitre) => normalizeText(intertitre.text))
  let next = 0
  let converted = 0

  const newChildren = children.map((node) => {
    if (node.type !== 'paragraph' || next >= wanted.length) return node
    const text = normalizeText(plainText(node))
    if (!text) return node
    const index = wanted.indexOf(text, next)
    if (index === -1) return node

    next = index + 1
    converted += 1
    return {
      type: 'heading',
      tag: intertitres[index].tag,
      children: (node.children ?? []).map(withoutBold),
      direction: node.direction ?? null,
      format: '',
      indent: 0,
      version: 1,
    } satisfies LexicalNode
  })

  return converted === 0
    ? { content, converted }
    : { content: { ...content, root: { ...content.root, children: newChildren } }, converted }
}

/** Inverse : les intertitres rétablis redeviennent des paragraphes (migration down). */
export function revertIntertitres<T extends { root?: LexicalNode }>(
  content: T,
  intertitres: Intertitre[],
): { content: T; reverted: number } {
  const children = content?.root?.children
  if (!children) return { content, reverted: 0 }
  const texts = new Set(intertitres.map((intertitre) => normalizeText(intertitre.text)))
  let reverted = 0

  const newChildren = children.map((node) => {
    if (node.type !== 'heading' || !texts.has(normalizeText(plainText(node)))) return node
    reverted += 1
    return {
      type: 'paragraph',
      children: node.children ?? [],
      direction: node.direction ?? null,
      format: '',
      indent: 0,
      version: 1,
      textFormat: 0,
      textStyle: '',
    } satisfies LexicalNode
  })

  return reverted === 0
    ? { content, reverted }
    : { content: { ...content, root: { ...content.root, children: newChildren } }, reverted }
}
