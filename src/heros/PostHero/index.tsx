import Link from 'next/link'
import React from 'react'

import type { Post } from '@/payload-types'

import { Media } from '@/components/Media'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { formatAuthors } from '@/utilities/formatAuthors'
import { formatDateTime } from '@/utilities/formatDateTime'
import { readingTime } from '@/utilities/readingTime'

/**
 * En-tête d'article : rubrique sous le filet, grand titre, une ligne de contexte écrite
 * comme une phrase, puis la photo en pleine largeur. Le titre part du bord gauche de la
 * colonne de lecture et déborde à droite, comme dans un magazine.
 */
export const PostHero: React.FC<{ post: Post }> = ({ post }) => {
  const { categories, heroImage, populatedAuthors, publishedAt, title, content } = post

  const rubriques = (categories ?? []).filter(
    (category): category is Exclude<typeof category, number> =>
      typeof category === 'object' && category !== null && category.slug !== 'non-classe',
  )
  const auteurs = populatedAuthors?.length ? formatAuthors(populatedAuthors) : ''
  const minutes = readingTime(content)

  return (
    <header className="pt-10 md:pt-16">
      <Breadcrumbs post={post} visual={false} />

      <div className="container">
        <div className="mx-auto max-w-measure">
          <div className="xl:w-[54rem]">
            {rubriques.length > 0 && (
              <p className="filet font-sans font-condensed text-[0.9375rem] font-semibold">
                {rubriques.map((rubrique, index) => (
                  <React.Fragment key={rubrique.id}>
                    {index > 0 && ', '}
                    <Link href={`/${rubrique.slug}`} className="text-sauge-ink hover:underline">
                      {rubrique.title}
                    </Link>
                  </React.Fragment>
                ))}
              </p>
            )}

            <h1 className="mt-5 font-serif text-h1 text-balance text-ink md:text-display">
              {title}
            </h1>

            <p className="meta mt-6 text-[0.9375rem]">
              {auteurs && <>Par {auteurs}, </>}
              {publishedAt && (
                <>
                  le <time dateTime={publishedAt}>{formatDateTime(publishedAt)}</time>.{' '}
                </>
              )}
              {minutes} min de lecture.
            </p>
          </div>
        </div>
      </div>

      {heroImage && typeof heroImage === 'object' && (
        <figure className="container mt-10 md:mt-14">
          <div className="relative aspect-[4/3] overflow-hidden bg-muted md:aspect-[16/9]">
            <Media
              resource={heroImage}
              fill
              priority
              size="(max-width: 1280px) 100vw, 1200px"
              imgClassName="object-cover"
            />
          </div>
        </figure>
      )}
    </header>
  )
}
