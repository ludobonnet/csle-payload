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

/**
 * Mesure d'audience : Umami auto-hébergé sur le VPS (sans cookie), servi par stats.csle.fr.
 * Le script n'envoie rien hors des domaines de prod (dev et recette ne polluent pas les stats).
 */
export const UMAMI = {
  scriptUrl: 'https://stats.csle.fr/script.js',
  websiteId: '4ea0de58-f370-4d31-9bb2-44e1ebd68c14',
  domains: 'csle.fr,www.csle.fr',
} as const
