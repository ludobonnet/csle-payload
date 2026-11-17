import { cn } from '@/utilities/ui'
import { SITE_NAME } from '@/utilities/site'

/**
 * Logo typographique dans la serif éditoriale du site. Hérite de la couleur du
 * texte : s'adapte seul au thème clair/sombre et au pied de page foncé.
 */
export const Logo = ({ className }: { className?: string }) => (
  <span className={cn('font-display text-3xl font-bold leading-none tracking-tight', className)}>
    {SITE_NAME}
  </span>
)
