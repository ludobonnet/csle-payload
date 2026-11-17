import type { ReactNode } from 'react'

/** Gabarit des pages légales : colonne de lecture, typographie du site. */
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
    <article className="container py-16 md:py-24">
      <div className="mx-auto max-w-[48rem]">
        <h1 className="font-display text-h1">{title}</h1>
        {updatedAt && <p className="mt-3 text-caption text-muted-foreground">Mise à jour : {updatedAt}</p>}
        <div className="prose md:prose-md dark:prose-invert mt-10 max-w-none">{children}</div>
      </div>
    </article>
  )
}
