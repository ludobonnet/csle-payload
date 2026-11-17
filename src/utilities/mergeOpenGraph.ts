import type { Metadata } from 'next'

import { SITE_DESCRIPTION, SITE_NAME, pageTitle } from './site'

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  locale: 'fr_FR',
  description: SITE_DESCRIPTION,
  siteName: SITE_NAME,
  title: pageTitle(),
}

export const mergeOpenGraph = (og?: Metadata['openGraph']): Metadata['openGraph'] => ({
  ...defaultOpenGraph,
  ...og,
})
