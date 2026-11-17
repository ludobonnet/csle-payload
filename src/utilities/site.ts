/** Identité du site, reprise du WordPress d'origine (titres « Titre - CSLE »). */
export const SITE_NAME = 'CSLE'
export const SITE_DESCRIPTION = 'Magazine voyage tourisme culture et lifestyle'

/** Titre de page : « Titre - CSLE », ou le titre de la home sans argument. */
export const pageTitle = (title?: string | null): string =>
  title ? `${title} - ${SITE_NAME}` : `${SITE_NAME} - ${SITE_DESCRIPTION}`
