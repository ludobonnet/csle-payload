import type { Metadata } from 'next'
import Link from 'next/link'

import { LegalPage } from '@/components/LegalPage'
import { CONTACT_PATH, pageTitle, SITE_EDITOR } from '@/utilities/site'

export const metadata: Metadata = {
  title: pageTitle('Mentions légales'),
  alternates: { canonical: '/mentions-legales' },
}

// Blog personnel, éditeur non professionnel (LCEN, art. 6 III).
export default function MentionsLegales() {
  return (
    <LegalPage title="Mentions légales" updatedAt="17 novembre 2026">
      <h2>Éditeur</h2>
      <p>
        csle.fr est un blog personnel, non professionnel, édité par {SITE_EDITOR}, également
        directeur de la publication.
        <br />
        Contact : <Link href={CONTACT_PATH}>formulaire de contact</Link>
      </p>

      <h2>Hébergement</h2>
      <p>
        Site hébergé par PulseHeberg, SAS au capital de 1 000 €, RCS Toulon 824 070 619,
        <br />9 boulevard de Strasbourg, 83000 Toulon, France — +33 (0)4 22 14 13 60.
      </p>
      <p>
        Images et diffusion du site : Cloudflare, Inc., 101 Townsend Street, San Francisco, CA
        94107, États-Unis.
      </p>

      <h2>Contenus</h2>
      <p>
        Les textes et photos publiés sur csle.fr sont, sauf mention contraire, la propriété de leurs
        auteurs. Toute reproduction sans autorisation est interdite. Les marques, visuels et
        contenus de tiers cités restent la propriété de leurs titulaires.
      </p>
      <p>
        Les liens vers d’autres sites sont fournis à titre d’information ; csle.fr n’est pas
        responsable de leur contenu. Pour signaler un contenu ou demander une correction, passez par
        le <Link href={CONTACT_PATH}>formulaire de contact</Link>.
      </p>

      <h2>Données personnelles</h2>
      <p>
        Voir la page <Link href="/confidentialite">Confidentialité</Link>.
      </p>
    </LegalPage>
  )
}
