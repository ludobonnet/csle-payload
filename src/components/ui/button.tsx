import { cn } from '@/utilities/ui'
import { Slot } from '@radix-ui/react-slot'
import { type VariantProps, cva } from 'class-variance-authority'
import * as React from 'react'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none font-sans text-[0.9375rem] font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 aria-invalid:focus-visible:ring-0",
  {
    variants: {
      variant: {
        // Aplat sauge, texte à l'encre (4,98:1), surligné anis au survol
        default: 'bg-sauge text-[#2a2420] hover:bg-anis',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border-2 border-ink bg-transparent text-ink hover:bg-wash',
        secondary: 'bg-wash text-ink hover:bg-wash/70',
        ghost: 'text-ink hover:bg-wash',
        link: 'text-ink underline decoration-sauge decoration-[1.5px] underline-offset-4 hover:text-sauge-ink',
      },
      size: {
        clear: '',
        default: 'h-11 px-5 py-2 has-[>svg]:px-4',
        sm: 'h-9 px-3 has-[>svg]:px-2.5',
        lg: 'h-12 px-8 has-[>svg]:px-4',
        icon: 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button: React.FC<ButtonProps> = ({ asChild = false, className, size, variant, ...props }) => {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
