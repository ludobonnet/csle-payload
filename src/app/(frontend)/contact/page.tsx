import type { Metadata } from 'next'

import { LegalPage } from '@/components/LegalPage'
import { pageTitle, TALLY_FORM_ID } from '@/utilities/site'

export const metadata: Metadata = {
  title: pageTitle('Contact'),
  alternates: { canonical: '/contact' },
}

/** Formulaire Tally intégré : le script et les données Tally ne chargent que sur cette page. */
export default function Contact() {
  return (
    <LegalPage title="Contact">
      <p>Une question, une correction, une idée de sujet ? Écrivez-nous, on lit tout.</p>
      {TALLY_FORM_ID ? (
        <iframe
          src={`https://tally.so/embed/${TALLY_FORM_ID}?alignLeft=1&hideTitle=1&transparentBackground=1`}
          title="Formulaire de contact"
          loading="lazy"
          className="not-prose mt-8 h-[640px] w-full border-0"
        />
      ) : (
        <p>Le formulaire de contact arrive très bientôt.</p>
      )}
    </LegalPage>
  )
}
