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
    <div className="container py-28">
      <p className="font-display text-display text-primary">404</p>
      <h1 className="font-display text-h2 mt-4">Cette page s’est perdue en chemin</h1>
      <p className="text-body mt-4 mb-8 max-w-prose text-muted-foreground">
        L’article a peut-être changé d’adresse, ou n’a jamais existé. Les derniers articles et la
        recherche sont toujours là.
      </p>
      <div className="flex flex-wrap gap-4">
        <Button asChild>
          <Link href="/">Retour à l’accueil</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/search">Rechercher</Link>
        </Button>
      </div>
    </div>
  )
}
