import { cn } from '@/utilities/ui'

/**
 * Lien de navigation : la rubrique courante porte le filet sauge en haut de l'en-tête,
 * comme sur le site d'origine.
 */
export const navLinkClass = (active: boolean) =>
  cn(
    'relative flex items-center font-sans font-condensed text-[0.9375rem] font-semibold text-ink transition-colors hover:text-sauge-ink',
    'after:absolute after:inset-x-0 after:top-0 after:h-[0.3125rem] after:bg-sauge after:transition-transform after:origin-left',
    active ? 'after:scale-x-100' : 'after:scale-x-0',
  )
