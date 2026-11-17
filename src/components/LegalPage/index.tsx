import type { ReactNode } from 'react'

/**
 * Gabarit des pages de service (mentions légales, confidentialité, contact) : titre sous
 * le filet, colonne de lecture du site, intertitres en grotesque pour se distinguer des articles.
 */
export function LegalPage({
  title,
  updatedAt,
  children,
}: {
  title: string
  updatedAt?: string
  children: ReactNode
}) {
  return (
    <article className="container pb-8 pt-12 md:pt-20">
      <div className="mx-auto max-w-measure">
        <h1 className="filet font-serif text-h1 text-ink">{title}</h1>
        {updatedAt && <p className="meta mt-4">Mise à jour le {updatedAt}.</p>}
        <div className="prose mt-10 prose-h2:font-sans prose-h2:font-condensed prose-h2:text-[1.0625rem] prose-h2:font-semibold prose-h2:tracking-normal">
          {children}
        </div>
      </div>
    </article>
  )
}
