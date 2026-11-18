import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Données : reprend la bio de Sandrine telle qu'elle figurait dans WordPress
 * (wp_usermeta.description, utilisateur 7), perdue à la migration. Ne remplace jamais
 * une bio déjà saisie dans l'admin. Ludo n'avait pas de bio dans WordPress.
 */
const BIO = [
  'Passionnée par les voyages, le sport et mes chiens.',
  "J'écris aussi sur les livres et pleins d'autres trucs sympas.",
  "J'aime les sorties, les rencontres, bref la vie... et les talons.",
  'Je blogue aussi un peu sur blogosports.com',
  'Mon plus grand rêve est de faire le tour du monde.',
].join('\n')

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "users" SET "bio" = ${BIO}
    WHERE "name" = 'Sandrine' AND ("bio" IS NULL OR "bio" = '');`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "users" SET "bio" = NULL
    WHERE "name" = 'Sandrine' AND "bio" = ${BIO};`)
}
