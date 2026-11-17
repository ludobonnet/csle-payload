'use client'

import type { StaticImageData } from 'next/image'

import NextImage from 'next/image'
import React from 'react'

import type { Props as MediaProps } from '../types'

import { getMediaUrl } from '@/utilities/getMediaUrl'
import { cn } from '@/utilities/ui'

/**
 * Image Payload ou statique, optimisée par Next (`/_next/image`).
 *
 * Les URLs Payload sont absolues en prod (R2, `images.csle.fr`, autorisé dans
 * `remotePatterns`) et relatives en dev (stockage disque). `getMediaUrl` gère
 * les deux et ajoute `updatedAt` pour invalider le cache si l'image est remplacée.
 *
 * `size` est l'attribut `sizes` : la largeur réellement affichée. Par défaut
 * pleine largeur ; à préciser dès que l'image est plus étroite que l'écran.
 */
export const ImageMedia: React.FC<MediaProps> = (props) => {
  const {
    alt: altFromProps,
    fill,
    pictureClassName,
    imgClassName,
    priority,
    resource,
    size = '100vw',
    src: srcFromProps,
    loading: loadingFromProps,
  } = props

  let width: number | undefined
  let height: number | undefined
  let alt = altFromProps
  let src: StaticImageData | string = srcFromProps || ''

  if (!src && resource && typeof resource === 'object') {
    width = resource.width ?? undefined
    height = resource.height ?? undefined
    alt = resource.alt || ''
    src = getMediaUrl(resource.url, resource.updatedAt)
  }

  if (!src) return null

  return (
    <picture className={cn(pictureClassName)}>
      <NextImage
        alt={alt || ''}
        // En mode fill, recadrer plutôt que déformer (sauf choix explicite)
        className={cn(fill && 'object-cover', imgClassName)}
        fill={fill}
        height={!fill ? height : undefined}
        priority={priority}
        loading={loadingFromProps || (priority ? undefined : 'lazy')}
        sizes={size}
        src={src}
        width={!fill ? width : undefined}
      />
    </picture>
  )
}
