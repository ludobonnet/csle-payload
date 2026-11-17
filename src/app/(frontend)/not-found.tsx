import type { Metadata } from 'next'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { pageTitle } from '@/utilities/site'

export const metadata: Metadata = {
  title: pageTitle('Page introuvable'),
  robots: { index: false },
}

export default function NotFound() {
  return (
    <div className="container pb-12 pt-16 md:pt-28">
      <div className="max-w-2xl">
        <p className="filet font-sans font-condensed text-[0.9375rem] font-semibold text-sauge-ink">
          Erreur 404
        </p>
        <h1 className="mt-5 font-serif text-display text-balance text-ink">
          Cette page s’est perdue en chemin
        </h1>
        <p className="mt-6 max-w-xl font-serif text-[1.25rem] leading-relaxed text-ink-soft">
          L’article a peut-être changé d’adresse, ou n’a jamais existé. Les rubriques et la
          recherche sont toujours là.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Button asChild>
            <Link href="/search">Rechercher un article</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Retour à l’accueil</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
