/**
 * Essai à blanc de la migration des intertitres (lecture seule) : combien d'intertitres
 * retrouvent leur paragraphe, et lesquels manquent. Lit un export des articles :
 *
 *   psql "$DATABASE_URL" -Atc "select json_build_object('slug', slug, 'content', content) from posts" > /tmp/posts.jsonl
 *   npx tsx scripts/migrate/dry-run-headings.ts /tmp/posts.jsonl
 */

import { readFileSync } from 'node:fs'

import { applyIntertitres } from '../../src/migrations/data/applyIntertitres.js'
import { INTERTITRES } from '../../src/migrations/data/intertitres.js'

const file = process.argv[2]
if (!file) throw new Error('Chemin de l’export JSON lines attendu')

const rows = readFileSync(file, 'utf8')
  .split('\n')
  .filter(Boolean)
  .map((line) => JSON.parse(line) as { slug: string; content: never })
  .filter((row) => row.slug in INTERTITRES)

let expected = 0
let converted = 0
const missing: string[] = []
for (const row of rows) {
  const intertitres = INTERTITRES[row.slug]
  const result = applyIntertitres(row.content, intertitres)
  expected += intertitres.length
  converted += result.converted
  if (result.converted < intertitres.length) {
    missing.push(`${row.slug} : ${result.converted}/${intertitres.length}`)
  }
}

console.log(`${rows.length}/${Object.keys(INTERTITRES).length} articles trouvés en base`)
console.log(`${converted}/${expected} intertitres retrouvés`)
console.log(missing.join('\n'))
