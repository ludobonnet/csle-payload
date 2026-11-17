import { s3Storage } from '@payloadcms/storage-s3'

/**
 * Médias sur Cloudflare R2, servis directement depuis `images.csle.fr`
 * (même principe que LSAN : bucket public dédié, jeton dédié, domaine à nous).
 *
 * Sans configuration R2 (dev local), le plugin est désactivé et Payload garde
 * le stockage disque dans `public/media`. `alwaysInsertFields` garantit un
 * schéma identique dans les deux cas : les migrations restent valables partout.
 */
const env = {
  endpoint: process.env.R2_ENDPOINT,
  accessKeyId: process.env.R2_MEDIA_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_MEDIA_SECRET_ACCESS_KEY,
  bucket: process.env.R2_MEDIA_BUCKET,
  publicBaseUrl: process.env.MEDIA_PUBLIC_BASE_URL?.replace(/\/+$/, ''),
}

export const isMediaStorageConfigured = Object.values(env).every(Boolean)

export const mediaStorage = s3Storage({
  enabled: isMediaStorageConfigured,
  alwaysInsertFields: true,
  bucket: env.bucket || '',
  config: {
    endpoint: env.endpoint,
    region: 'auto',
    credentials: {
      accessKeyId: env.accessKeyId || '',
      secretAccessKey: env.secretAccessKey || '',
    },
  },
  collections: {
    media: {
      // Lien direct vers le domaine public du bucket : pas de transit par Node
      disablePayloadAccessControl: true,
      generateFileURL: ({ filename, prefix }) =>
        `${env.publicBaseUrl}/${[prefix, filename]
          .filter(Boolean)
          .join('/')
          .split('/')
          .map(encodeURIComponent)
          .join('/')}`,
    },
  },
})
