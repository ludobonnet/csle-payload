/**
 * Relève les intertitres des articles WordPress, que la migration initiale a convertis en
 * paragraphes (l'éditeur headless n'avait pas le nœud « heading »). Produit le fichier de
 * données lu par la migration Payload 20261118_100000_intertitres.
 *
 * Niveaux relatifs à chaque article : le plus haut devient h2 (le titre de l'article est h1),
 * les suivants h3 puis h4. Les rédacteurs utilisaient surtout h3 comme premier niveau.
 *
 * Lancer : npx tsx scripts/migrate/extract-headings.ts (base WordPress locale, csle-db-1)
 */

import { writeFileSync } from 'node:fs'
import { JSDOM } from 'jsdom'

import { closeConnection, query, wpTable } from './utils/db.js'

type Heading = { tag: 'h2' | 'h3' | 'h4'; text: string }

const OUTPUT = new URL('../../src/migrations/data/intertitres.ts', import.meta.url)

const clean = (text: string) => text.replace(/\s+/g, ' ').trim()

async function main() {
  const posts = await query<{ post_name: string; post_content: string }>(
    `SELECT post_name, post_content FROM ${wpTable('posts')}
     WHERE post_status = 'publish' AND post_type = 'post' AND post_content REGEXP '<h[1-6]'
     ORDER BY post_name`,
  )

  const data: Record<string, Heading[]> = {}
  let total = 0

  for (const post of posts) {
    const { document } = new JSDOM(`<body>${post.post_content}</body>`).window
    const found = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')]
      .map((el) => ({ level: Number(el.tagName[1]), text: clean(el.textContent ?? '') }))
      // Sans les vides et les shortcodes enrobés d'un <h3> ([gallery …]) : pas des intertitres
      .filter((heading) => heading.text.length > 0 && !/^\[[^\]]*\]$/.test(heading.text))
    if (found.length === 0) continue

    const top = Math.min(...found.map((heading) => heading.level))
    data[post.post_name] = found.map((heading) => ({
      tag: `h${Math.min(4, heading.level - top + 2)}` as Heading['tag'],
      text: heading.text,
    }))
    total += found.length
  }

  const banner = `/**
 * Intertitres des articles WordPress (slug → intertitres dans l'ordre du texte).
 * Généré par scripts/migrate/extract-headings.ts, ne pas modifier à la main.
 */\n`
  writeFileSync(
    OUTPUT,
    `${banner}export const INTERTITRES: Record<string, { tag: 'h2' | 'h3' | 'h4'; text: string }[]> = ${JSON.stringify(data, null, 2)}\n`,
  )
  console.log(`${Object.keys(data).length} articles, ${total} intertitres → ${OUTPUT.pathname}`)
  await closeConnection()
}

main().catch(async (err) => {
  console.error(err)
  await closeConnection()
  process.exit(1)
})
