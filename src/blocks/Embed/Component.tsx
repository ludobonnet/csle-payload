import React from 'react'
import { cn } from '@/utilities/ui'
import type { EmbedBlock as EmbedBlockProps } from '@/payload-types'

type Props = EmbedBlockProps & {
  className?: string
  disableInnerContainer?: boolean
}

function getEmbedUrl(provider: string, embedId: string): string {
  switch (provider) {
    case 'youtube':
      return `https://www.youtube.com/embed/${embedId}`
    case 'vimeo':
      return `https://player.vimeo.com/video/${embedId}`
    case 'dailymotion':
      return `https://www.dailymotion.com/embed/video/${embedId}`
    default:
      return ''
  }
}

function getProviderName(provider: string): string {
  switch (provider) {
    case 'youtube':
      return 'YouTube'
    case 'vimeo':
      return 'Vimeo'
    case 'dailymotion':
      return 'Dailymotion'
    default:
      return 'Video'
  }
}

export const EmbedBlock: React.FC<Props> = (props) => {
  const { provider, embedId, className, disableInnerContainer } = props

  if (!provider || !embedId) {
    return null
  }

  const embedUrl = getEmbedUrl(provider, embedId)
  const providerName = getProviderName(provider)

  return (
    <div
      className={cn(
        {
          container: !disableInnerContainer,
        },
        className,
      )}
    >
      <div className="relative w-full overflow-hidden rounded-lg" style={{ paddingTop: '56.25%' }}>
        <iframe
          className="absolute inset-0 h-full w-full border-0"
          src={embedUrl}
          title={`${providerName} video player`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>
  )
}
