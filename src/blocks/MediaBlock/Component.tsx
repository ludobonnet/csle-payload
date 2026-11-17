import type { StaticImageData } from 'next/image'

import { cn } from '@/utilities/ui'
import React from 'react'
import RichText from '@/components/RichText'

import type { MediaBlock as MediaBlockProps } from '@/payload-types'

import { Media } from '../../components/Media'

type Props = MediaBlockProps & {
  breakout?: boolean
  captionClassName?: string
  className?: string
  enableGutter?: boolean
  imgClassName?: string
  /** Attribut `sizes` de l'image (largeur affichée) */
  size?: string
  staticImage?: StaticImageData
  disableInnerContainer?: boolean
}

/** Photo avec légende facultative : image à bords francs, légende en petite grotesque. */
export const MediaBlock: React.FC<Props> = (props) => {
  const {
    captionClassName,
    className,
    enableGutter = true,
    imgClassName,
    media,
    size,
    staticImage,
  } = props

  const caption = media && typeof media === 'object' ? media.caption : undefined

  return (
    <figure className={cn({ container: enableGutter }, className)}>
      {(media || staticImage) && (
        <Media
          imgClassName={cn('h-auto w-full', imgClassName)}
          resource={media}
          size={size}
          src={staticImage}
        />
      )}
      {caption && (
        <figcaption className={cn('meta mt-3', captionClassName)}>
          <RichText data={caption} enableGutter={false} enableProse={false} className="[&_p]:m-0" />
        </figcaption>
      )}
    </figure>
  )
}
