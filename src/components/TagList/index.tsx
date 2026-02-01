import Link from 'next/link'
import type { Tag } from '@/payload-types'
import { cn } from '@/utilities/ui'
import { TagIcon } from 'lucide-react'

type Props = {
  tags: (Tag | number)[]
  className?: string
}

export function TagList({ tags, className }: Props) {
  // Filter to only include populated tag objects
  const populatedTags = tags.filter((tag): tag is Tag => typeof tag === 'object')

  if (populatedTags.length === 0) {
    return null
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2 mt-8 pt-8 border-t border-border', className)}>
      <div className="flex items-center gap-1.5 text-muted-foreground text-caption uppercase tracking-wider">
        <TagIcon className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Tags</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {populatedTags.map((tag) => (
          <Link
            key={tag.id}
            href={`/tag/${tag.slug}`}
            className={cn(
              'inline-flex items-center px-3 py-1.5 rounded-full',
              'text-caption font-medium',
              'border border-border bg-card',
              'transition-all duration-200',
              'hover:border-primary hover:text-primary hover:bg-primary/5',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
            )}
          >
            {tag.title}
          </Link>
        ))}
      </div>
    </div>
  )
}
