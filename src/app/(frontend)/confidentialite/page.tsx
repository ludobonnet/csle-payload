import type { Metadata } from 'next'
import Link from 'next/link'

import { LegalPage } from '@/components/LegalPage'
import { CONTACT_PATH, pageTitle, SITE_EDITOR } from '@/utilities/site'

export const metadata: Metadata = {
  title: pageTitle('Confidentialité'),
  alternates: { canonical: '/confidentialite' },
}

export default function Confidentialite() {
  return (
    <LegalPage title="Confidentialité" updatedAt="17 novembre 2026">
      <p>
        csle.fr se lit sans compte et sans publicité. Aucun cookie n’est déposé sur votre navigateur
        pour la simple lecture du site.
      </p>

      <h2>Ce qui est collecté</h2>
      <ul>
        <li>
          <strong>Journaux techniques</strong> : comme tout serveur web, l’hébergeur et Cloudflare
          traitent l’adresse IP et les en-têtes des requêtes, pour acheminer les pages et protéger
          le site contre les abus. Ces journaux ne servent à rien d’autre.
        </li>
        <li>
          <strong>Espace d’administration</strong> : les auteurs connectés reçoivent un cookie de
          session, strictement nécessaire à leur connexion.
        </li>
      </ul>

      <h2>Mesure d’audience</h2>
      <p>
        Pour savoir quels articles sont lus, le site utilise Umami, un outil de statistiques que
        nous hébergeons nous-mêmes en France, sur le même serveur que le site (stats.csle.fr). Il ne
        dépose aucun cookie, ne conserve pas votre adresse IP et ne permet ni de vous identifier ni
        de vous suivre d’un site à l’autre : il compte des pages vues, des pages d’origine, des
        types d’appareil et des pays. Ces données ne sont ni revendues ni partagées. Si votre
        navigateur envoie le signal « Do Not Track », aucune statistique n’est enregistrée.
      </p>

      <h2>Formulaire de contact</h2>
      <p>
        Le formulaire de la page <Link href={CONTACT_PATH}>Contact</Link> est fourni par Tally
        (Tally BV, Belgique), qui héberge les messages dans l’Union européenne. Les informations que
        vous y saisissez servent uniquement à vous répondre et sont supprimées une fois l’échange
        terminé.
      </p>

      <h2>Vidéos intégrées</h2>
      <p>
        Certains articles intègrent des vidéos YouTube, Vimeo ou Dailymotion. YouTube est intégré en
        mode « confidentialité renforcée » et Vimeo sans suivi : ils ne déposent pas de cookie tant
        que vous ne lancez pas la lecture. En lançant une vidéo, vous interagissez avec le service
        concerné, qui applique sa propre politique de confidentialité.
      </p>

      <h2>Vos droits</h2>
      <p>
        Responsable du traitement : {SITE_EDITOR}. Pour toute question ou pour exercer vos droits
        d’accès, de rectification ou d’effacement, utilisez le{' '}
        <Link href={CONTACT_PATH}>formulaire de contact</Link>. Vous pouvez aussi saisir la CNIL (
        <a href="https://www.cnil.fr">cnil.fr</a>).
      </p>
    </LegalPage>
  )
}
