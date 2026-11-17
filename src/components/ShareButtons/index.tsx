'use client'

import { useState } from 'react'
import { Facebook, Twitter, Linkedin, Link as LinkIcon, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/ui'

type ShareButtonsProps = {
  title: string
  slug: string
  description?: string
  className?: string
}

export function ShareButtons({ title, slug, description, className }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)

  const url = `${process.env.NEXT_PUBLIC_SERVER_URL || 'https://csle.fr'}/${slug}`
  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  // Share URLs for each platform
  const shareUrls = {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        })
      } catch (err) {
        // User cancelled or share failed - ignore
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err)
        }
      }
    }
  }

  // Check if native share is available (mobile devices)
  const hasNativeShare = typeof navigator !== 'undefined' && navigator.share

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-sm font-medium text-muted-foreground mr-2">Partager</span>

      {hasNativeShare ? (
        // On mobile: show single native share button
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNativeShare}
          className="hover:bg-accent hover:text-accent-foreground transition-colors"
          aria-label="Partager cet article"
        >
          <LinkIcon className="size-4" />
        </Button>
      ) : (
        // On desktop: show individual platform buttons
        <>
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="hover:text-[#1DA1F2] transition-colors"
            aria-label="Partager sur Twitter"
          >
            <a href={shareUrls.twitter} target="_blank" rel="noopener noreferrer">
              <Twitter className="size-4" />
            </a>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            asChild
            className="hover:text-[#1877F2] transition-colors"
            aria-label="Partager sur Facebook"
          >
            <a href={shareUrls.facebook} target="_blank" rel="noopener noreferrer">
              <Facebook className="size-4" />
            </a>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            asChild
            className="hover:text-[#0A66C2] transition-colors"
            aria-label="Partager sur LinkedIn"
          >
            <a href={shareUrls.linkedin} target="_blank" rel="noopener noreferrer">
              <Linkedin className="size-4" />
            </a>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopyLink}
            className="relative hover:text-primary transition-colors"
            aria-label="Copier le lien"
          >
            {copied ? <Check className="size-4" /> : <LinkIcon className="size-4" />}
            {copied && (
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs bg-foreground text-background px-2 py-1 rounded whitespace-nowrap">
                Copié !
              </span>
            )}
          </Button>
        </>
      )}
    </div>
  )
}
