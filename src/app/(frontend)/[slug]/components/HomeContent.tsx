import configPromise from '@payload-config'
import Link from 'next/link'
import { getPayload, type RequiredDataFromCollectionSlug } from 'payload'
import React from 'react'

import type { Post } from '@/payload-types'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { Card, type CardPostData, FeaturedCard, MinimalCard } from '@/components/Card'
import { getRubriques, type Rubrique } from '@/utilities/getRubriques'
import { cn } from '@/utilities/ui'

type Props = {
  page: RequiredDataFromCollectionSlug<'pages'>
  featuredPosts: Post[]
}

/** Rubriques qui ont chacune leur section sur l'accueil. */
const SECTIONS_ACCUEIL = 4
/** Un grand article et trois en sommaire */
const POSTS_PAR_SECTION = 4

const cardSelect = {
  title: true,
  slug: true,
  categories: true,
  meta: true,
  heroImage: true,
  publishedAt: true,
} as const

/**
 * Accueil organisé par rubriques plutôt que par date : le magazine a quinze ans
 * d'archives, ce sont elles qu'on feuillette. Le dernier article ouvre la page.
 */
export async function HomeContent({ page, featuredPosts }: Props) {
  const { layout } = page
  const lead = featuredPosts[0]
  const rubriques = await getRubriques()
  const sections = rubriques.slice(0, SECTIONS_ACCUEIL)

  const payload = await getPayload({ config: configPromise })
  // Requêtes en parallèle, avec de la marge : un article classé dans deux rubriques
  // n'apparaît qu'une fois, dans la première section qui le montre.
  const candidates = await Promise.all(
    sections.map((rubrique) =>
      payload
        .find({
          collection: 'posts',
          depth: 1,
          limit: POSTS_PAR_SECTION * 2 + 1,
          sort: '-publishedAt',
          overrideAccess: false,
          where: {
            and: [{ _status: { equals: 'published' } }, { categories: { contains: rubrique.id } }],
          },
          select: cardSelect,
        })
        .then((result) => result.docs),
    ),
  )
  const shown = new Set<number>(lead ? [lead.id] : [])
  const sectionPosts = candidates.map((docs) => {
    const picked = docs.filter((doc) => !shown.has(doc.id)).slice(0, POSTS_PAR_SECTION)
    picked.forEach((doc) => shown.add(doc.id))
    return picked
  })

  return (
    <>
      <h1 className="sr-only">csle, magazine voyage, culture et lifestyle</h1>

      {lead && (
        <section aria-labelledby="a-la-une" className="container pt-10 md:pt-16">
          <h2 id="a-la-une" className="filet font-serif text-h3 text-ink">
            À la une
          </h2>
          <FeaturedCard doc={lead} priority headingLevel="h3" className="mt-8" />
        </section>
      )}

      {sections.map((rubrique, index) => (
        <RubriqueSection
          key={rubrique.id}
          rubrique={rubrique}
          posts={sectionPosts[index]}
          reverse={index % 2 === 1}
        />
      ))}

      <section aria-labelledby="toutes-les-rubriques" className="container mt-24">
        <h2 id="toutes-les-rubriques" className="filet font-serif text-h3 text-ink">
          Toutes les rubriques
        </h2>
        <ul className="mt-8 grid border-t border-line sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-3">
          {rubriques.map((rubrique) => (
            <li key={rubrique.id} className="border-b border-line">
              <Link
                href={`/${rubrique.slug}`}
                className="group flex items-baseline justify-between py-4"
              >
                <span className="font-serif text-h4 text-ink decoration-sauge decoration-[1.5px] underline-offset-4 group-hover:underline">
                  {rubrique.title}
                </span>
                <span className="meta tabular-nums">
                  {rubrique.count} article{rubrique.count > 1 ? 's' : ''}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {layout && layout.length > 0 && <RenderBlocks blocks={layout} />}
    </>
  )
}

/** Une rubrique : un grand article et trois en sommaire, de part et d'autre. */
function RubriqueSection({
  rubrique,
  posts,
  reverse,
}: {
  rubrique: Rubrique
  posts: (CardPostData & { id: number })[]
  reverse: boolean
}) {
  if (posts.length === 0) return null
  const [first, ...others] = posts
  const headingId = `rubrique-${rubrique.slug}`

  return (
    <section aria-labelledby={headingId} className="container mt-24">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <h2 id={headingId} className="filet font-serif text-h2 text-ink">
          <Link href={`/${rubrique.slug}`} className="hover:text-sauge-ink">
            {rubrique.title}
          </Link>
        </h2>
        <Link href={`/${rubrique.slug}`} className="font-sans text-[0.9375rem] font-semibold lien">
          Les {rubrique.count} articles {rubrique.title}
        </Link>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-12">
        <Card
          doc={first}
          showCategories={false}
          large
          className={cn('lg:col-span-7', reverse && 'lg:order-2')}
          size="(max-width: 1024px) 100vw, 700px"
        />
        <div
          className={cn(
            'flex flex-col divide-y divide-line lg:col-span-5',
            reverse && 'lg:order-1',
          )}
        >
          {others.map((post) => (
            <MinimalCard key={post.id} doc={post} className="py-5 first:pt-0" />
          ))}
        </div>
      </div>
    </section>
  )
}
