import { cn } from '@/utilities/ui'
import { SITE_NAME } from '@/utilities/site'

/**
 * Logo « csle » redessiné en tracés à partir du logo d'origine (2018) : quatre traits
 * ronds de même épaisseur. Couleur héritée (`currentColor`) : vert sauge par défaut,
 * blanc ou encre selon le fond. La hauteur se règle par `className` (h-7, h-9…).
 */
export const Logo = ({ className, title = SITE_NAME }: { className?: string; title?: string }) => (
  <svg
    viewBox="0 0 110 37"
    role="img"
    aria-label={title}
    className={cn('h-8 w-auto text-sauge', className)}
    fill="none"
    stroke="currentColor"
    strokeWidth={8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21.5 16.4A10 10 0 1 0 21.5 29.6" />
    <path d="M29.2 25.8 39.5 14.8A10 10 0 1 1 40 30.2" />
    <path d="M68.5 4V26Q68.5 33 76 33" />
    <path d="M86 23H106A10 10 0 1 0 100.7 31.8" />
  </svg>
)
