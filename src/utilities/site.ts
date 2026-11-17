/** Identité du site, reprise du WordPress d'origine (titres « Titre - CSLE »). */
export const SITE_NAME = 'CSLE'
export const SITE_DESCRIPTION = 'Magazine voyage tourisme culture et lifestyle'

/** Titre de page : « Titre - CSLE », ou le titre de la home sans argument. */
export const pageTitle = (title?: string | null): string =>
  title ? `${title} - ${SITE_NAME}` : `${SITE_NAME} - ${SITE_DESCRIPTION}`

/** Éditeur (blog personnel), repris dans les mentions légales et la confidentialité. */
export const SITE_EDITOR = 'Ludovic Bonnet'

/** Contact : formulaire Tally intégré à /contact. Identifiant = fin de l'URL tally.so/r/<id>. */
export const CONTACT_PATH = '/contact'
export const TALLY_FORM_ID = ''
