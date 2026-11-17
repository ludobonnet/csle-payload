declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PAYLOAD_SECRET: string
      DATABASE_URL: string
      NEXT_PUBLIC_SERVER_URL: string
      CRON_SECRET?: string
      PREVIEW_SECRET?: string
      // Médias sur R2 (absents en dev : stockage disque)
      R2_ENDPOINT?: string
      R2_MEDIA_ACCESS_KEY_ID?: string
      R2_MEDIA_SECRET_ACCESS_KEY?: string
      R2_MEDIA_BUCKET?: string
      MEDIA_PUBLIC_BASE_URL?: string
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {}
