/**
 * Migration configuration
 * WordPress to Payload CMS migration settings
 */

export const config = {
  // WordPress MariaDB connection
  wordpress: {
    host: process.env.WP_DB_HOST || '127.0.0.1',
    port: parseInt(process.env.WP_DB_PORT || '3306', 10),
    user: process.env.WP_DB_USER || 'wordpress',
    password: process.env.WP_DB_PASSWORD || 'wordpress',
    database: process.env.WP_DB_NAME || 'wordpress',
    // WordPress multisite table prefix (blog 5)
    tablePrefix: 'wp_5_',
    // Global users table (shared across multisite)
    usersTable: 'wp_users',
  },

  // WordPress media files location
  mediaBasePath:
    process.env.WP_MEDIA_PATH ||
    '/Users/ludobonnet/Projets/csle/sources/wp/wordpress/wp-content/blogs.dir/5/files',

  // WordPress author ID to Payload user mapping
  // WP ID -> { email, name }
  authorMapping: {
    1: { email: 'admin@csle.fr', name: 'Admin' },
    6: { email: 'ludo@csle.fr', name: 'Ludo' },
    7: { email: 'sandrine@csle.fr', name: 'Sandrine' },
  } as Record<number, { email: string; name: string }>,

  // Default password for created users (should be changed after migration)
  defaultPassword: process.env.MIGRATION_DEFAULT_PASSWORD || 'ChangeMe123!',

  // Migration batch sizes
  batchSize: {
    media: 10,
    posts: 20,
  },

  // Retry configuration for network errors
  retry: {
    maxAttempts: 3,
    initialDelayMs: 1000,
    backoffMultiplier: 2,
  },
}

export type Config = typeof config
