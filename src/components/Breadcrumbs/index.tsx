import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { Post, Category } from '@/payload-types'
import { cn } from '@/utilities/ui'

type BreadcrumbsProps = {
  post?: Post
  category?: Category
  className?: string
  /** false : seulement les données structurées (JSON-LD), sans fil visible */
  visual?: boolean
}

export function Breadcrumbs({ post, category, className, visual = true }: BreadcrumbsProps) {
  // Build breadcrumb items
  const items: Array<{ label: string; href: string; current?: boolean }> = [
    { label: 'Accueil', href: '/' },
  ]

  if (post) {
    // For posts: Home > Category > Article Title
    const firstCategory = post.categories?.[0]
    if (firstCategory && typeof firstCategory === 'object') {
      items.push({
        label: firstCategory.title,
        href: `/${firstCategory.slug}`,
      })
    }

    // Truncate long titles to ~40 chars
    const truncatedTitle = post.title.length > 40 ? `${post.title.substring(0, 40)}...` : post.title

    items.push({
      label: truncatedTitle,
      href: `/${post.slug}`,
      current: true,
    })
  } else if (category) {
    // For categories: Home > Category
    items.push({
      label: category.title,
      href: `/${category.slug}`,
      current: true,
    })
  }

  // Generate JSON-LD structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.current ? {} : { item: `https://csle.fr${item.href}` }),
    })),
  }

  return (
    <>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Visual breadcrumbs */}
      {visual && (
        <nav aria-label="Fil d'Ariane" className={cn('mb-4', className)}>
          <ol className="meta flex flex-wrap items-center gap-1.5">
            {items.map((item, index) => {
              const isLast = index === items.length - 1

              return (
                <li key={item.href} className="flex items-center gap-1.5">
                  {isLast ? (
                    <span className="text-ink" aria-current="page">
                      {item.label}
                    </span>
                  ) : (
                    <>
                      <Link
                        href={item.href}
                        className={cn(
                          'transition-colors duration-200',
                          'hover:text-sauge-ink hover:underline',
                        )}
                      >
                        {item.label}
                      </Link>
                      <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                    </>
                  )}
                </li>
              )
            })}
          </ol>
        </nav>
      )}
    </>
  )
}
