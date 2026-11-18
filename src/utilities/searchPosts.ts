import type { PostgresAdapter } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'
import type { SQL } from '@payloadcms/db-postgres/drizzle'
import type { Payload } from 'payload'

/**
 * Accents ramenés à la lettre de base, des deux côtés de la comparaison : « ecologie »
 * trouve « Écologie ». Fait à la main (translate) faute d'extension unaccent sur le serveur.
 */
const ACCENTED = 'àáâãäåçèéêëìíîïñòóôõöùúûüýÿœæ'
const PLAIN = 'aaaaaaceeeeiiiinooooouuuuyyoa'

const normalizeJs = (value: string) =>
  [...value.toLowerCase()].map((char) => PLAIN[ACCENTED.indexOf(char)] ?? char).join('')

const normalizeSql = (expression: SQL) =>
  sql`translate(lower(${expression}), ${ACCENTED}, ${PLAIN})`

/** Motif LIKE : % et _ saisis par le lecteur sont pris au pied de la lettre. */
const likePattern = (word: string) => `%${word.replace(/[\\%_]/g, (c) => `\\${c}`)}%`

/** Plafond de résultats : au-delà, la recherche est trop vague pour être utile. */
const MAX_IDS = 200

/** Bornes de la requête lue dans l'URL : longueur et nombre de mots distincts. */
const MAX_QUERY_LENGTH = 100
const MAX_WORDS = 6

/**
 * Recherche plein texte dans les articles publiés : titre, description et texte de l'article
 * (seuls les champs `text` du JSON Lexical, pas ses clés techniques). Chaque mot doit
 * apparaître quelque part. Articles dont le titre correspond d'abord, puis du plus récent
 * au plus ancien. Renvoie des identifiants : l'appelant relit les articles par l'API locale,
 * avec le contrôle d'accès.
 */
export async function searchPostIds(payload: Payload, query: string): Promise<number[]> {
  // Entrée bornée : chaque mot ajoute un parcours du texte de tous les articles
  const words = [
    ...new Set(
      normalizeJs(query.slice(0, MAX_QUERY_LENGTH))
        .split(/\s+/)
        .filter((word) => word.length > 1),
    ),
  ].slice(0, MAX_WORDS)
  if (words.length === 0) return []

  const title = normalizeSql(sql`p.title`)
  const description = normalizeSql(sql`coalesce(p.meta_description, '')`)
  const bodyText = normalizeSql(sql`t #>> '{}'`)

  const wordMatches = (word: string) => {
    const pattern = likePattern(word)
    return sql`(${title} like ${pattern} or ${description} like ${pattern} or exists (
      select 1 from jsonb_path_query(p.content, 'strict $.**.text') t where ${bodyText} like ${pattern}
    ))`
  }
  const titleMatchesAll = sql.join(
    words.map((word) => sql`${title} like ${likePattern(word)}`),
    sql` and `,
  )

  const db = (payload.db as unknown as PostgresAdapter).drizzle
  const result = await db.execute(sql`
    select p.id from posts p
    where p._status = 'published' and ${sql.join(words.map(wordMatches), sql` and `)}
    order by (${titleMatchesAll}) desc, p.published_at desc nulls last
    limit ${MAX_IDS}
  `)

  return (result.rows as { id: number }[]).map((row) => Number(row.id))
}
