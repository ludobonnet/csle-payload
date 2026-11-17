'use client'

import { useState, useSyncExternalStore } from 'react'
import { cn } from '@/utilities/ui'

type ShareButtonsProps = {
  title: string
  slug: string
  description?: string
  className?: string
}

const noopSubscribe = () => () => {}

const linkClass =
  'font-sans text-[0.9375rem] text-ink underline decoration-sauge decoration-[1.5px] underline-offset-[0.2em] hover:text-sauge-ink'

/**
 * Partage en liens texte, sans icônes de marques ni traceurs : copie du lien, e-mail,
 * Facebook, Bluesky, LinkedIn. Sur mobile, un seul bouton ouvre la feuille de partage du système.
 */
export function ShareButtons({ title, slug, description, className }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)
  // Lu après hydratation seulement (null côté serveur) : pas d'écart de rendu
  const hasNativeShare = useSyncExternalStore(
    noopSubscribe,
    () => typeof navigator.share === 'function' && window.matchMedia('(pointer: coarse)').matches,
    () => false,
  )

  const url = `${process.env.NEXT_PUBLIC_SERVER_URL || 'https://csle.fr'}/${slug}`
  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  const shareLinks = [
    { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    {
      label: 'Bluesky',
      href: `https://bsky.app/intent/compose?text=${encodedTitle}%20${encodedUrl}`,
    },
    {
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
  ]

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Presse-papiers refusé (contexte non sécurisé) : le lien reste dans la barre d'adresse
    }
  }

  const nativeShare = async () => {
    try {
      await navigator.share({ title, text: description, url })
    } catch {
      // Partage annulé par le lecteur
    }
  }

  return (
    <div className={cn('flex flex-wrap items-baseline gap-x-5 gap-y-2', className)}>
      <span className="font-sans font-condensed text-[0.9375rem] font-semibold">
        Partager l&apos;article
      </span>
      {hasNativeShare ? (
        <button type="button" onClick={nativeShare} className={linkClass}>
          Envoyer à quelqu&apos;un
        </button>
      ) : (
        <>
          <button type="button" onClick={copyLink} className={linkClass} aria-live="polite">
            {copied ? 'Lien copié' : 'Copier le lien'}
          </button>
          <a className={linkClass} href={`mailto:?subject=${encodedTitle}&body=${encodedUrl}`}>
            E-mail
          </a>
          {shareLinks.map((link) => (
            <a
              key={link.label}
              className={linkClass}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {link.label}
            </a>
          ))}
        </>
      )}
    </div>
  )
}
