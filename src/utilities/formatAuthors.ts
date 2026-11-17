import { Post } from '@/payload-types'

const listFormat = new Intl.ListFormat('fr-FR', { style: 'long', type: 'conjunction' })

/**
 * Noms des auteurs d'un article, en français : « Ludo », « Ludo et Sandrine ».
 * Les doublons (comptes en double) sont fusionnés.
 */
export const formatAuthors = (
  authors: NonNullable<NonNullable<Post['populatedAuthors']>[number]>[],
) => {
  const names = [...new Set(authors.map((author) => author.name).filter(Boolean) as string[])]
  return listFormat.format(names)
}
