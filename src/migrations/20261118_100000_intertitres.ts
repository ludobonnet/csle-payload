import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

import { applyIntertitres, revertIntertitres } from './data/applyIntertitres'
import { INTERTITRES } from './data/intertitres'

/**
 * Données : rétablit les intertitres de 122 articles, aplatis en paragraphes par la migration
 * WordPress (scripts/migrate/extract-headings.ts). Seuls les paragraphes dont le texte est
 * exactement celui d'un intertitre d'origine changent de type ; le reste du contenu, y compris
 * les corrections faites dans l'admin depuis, est conservé. L'article publié et sa dernière
 * version (celle qu'ouvre l'admin) sont mis à jour ensemble.
 */

type Row = { id: number; slug: string; content: never }
type VersionRow = { id: number; content: never }

type Transform = (content: never, slug: string) => { content: unknown; count: number }

async function rewrite(db: MigrateUpArgs['db'], transform: Transform) {
  const { rows } = await db.execute(sql`SELECT id, slug, content FROM posts`)
  let posts = 0
  let nodes = 0

  for (const row of rows as Row[]) {
    if (!(row.slug in INTERTITRES)) continue
    const result = transform(row.content, row.slug)
    if (result.count === 0) continue

    await db.execute(sql`
      UPDATE posts SET content = ${JSON.stringify(result.content)}::jsonb WHERE id = ${row.id}`)

    const versions = await db.execute(sql`
      SELECT id, version_content AS content FROM _posts_v WHERE parent_id = ${row.id} AND latest = true`)
    for (const version of versions.rows as VersionRow[]) {
      const versionResult = transform(version.content, row.slug)
      if (versionResult.count === 0) continue
      await db.execute(sql`
        UPDATE _posts_v SET version_content = ${JSON.stringify(versionResult.content)}::jsonb
        WHERE id = ${version.id}`)
    }

    posts += 1
    nodes += result.count
  }

  return { posts, nodes }
}

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  const { posts, nodes } = await rewrite(db, (content, slug) => {
    const { content: next, converted } = applyIntertitres(content, INTERTITRES[slug])
    return { content: next, count: converted }
  })
  payload.logger.info(`Intertitres rétablis : ${nodes} dans ${posts} articles`)
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  const { posts, nodes } = await rewrite(db, (content, slug) => {
    const { content: next, reverted } = revertIntertitres(content, INTERTITRES[slug])
    return { content: next, count: reverted }
  })
  payload.logger.info(`Intertitres retirés : ${nodes} dans ${posts} articles`)
}
