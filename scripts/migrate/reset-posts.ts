/**
 * Supprime tous les articles pour rejouer l'étape 04 de la migration
 * (qui ignore les slugs déjà présents).
 *
 * Refuse de tourner ailleurs que sur une base locale : la base de référence
 * ne doit jamais être vidée par erreur.
 *
 * Usage : pnpm tsx scripts/migrate/reset-posts.ts
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../../src/payload.config.js'

const url = new URL(process.env.DATABASE_URL || 'postgres://invalid')
if (!['127.0.0.1', 'localhost'].includes(url.hostname)) {
  console.error(`Refusé : DATABASE_URL vise ${url.hostname}, pas une base locale.`)
  process.exit(1)
}

const payload = await getPayload({ config })
const { totalDocs } = await payload.count({ collection: 'posts' })
const result = await payload.delete({
  collection: 'posts',
  where: { id: { exists: true } },
  context: { disableRevalidate: true },
})
console.log(`${result.docs.length}/${totalDocs} articles supprimés, ${result.errors.length} erreur(s)`)
process.exit(result.errors.length ? 1 : 0)
