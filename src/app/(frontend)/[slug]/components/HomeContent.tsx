import type { RequiredDataFromCollectionSlug } from 'payload'
import type { Post } from '@/payload-types'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { HomeHero } from '@/heros/HomeHero'
import { HomepageGrid } from '@/components/HomepageGrid'

type Props = {
  page: RequiredDataFromCollectionSlug<'pages'>
  featuredPosts: Post[]
}

export function HomeContent({ page, featuredPosts }: Props) {
  const { layout } = page

  // Get the first post for the hero, rest for the grid
  const heroPost = featuredPosts[0]
  const gridPosts = featuredPosts.slice(1)

  return (
    <>
      {/* Hero with featured post - Kinfolk style */}
      {heroPost && <HomeHero post={heroPost} />}

      {/* Latest articles grid */}
      {gridPosts.length > 0 && (
        <HomepageGrid
          posts={gridPosts}
          title="Articles récents"
          showViewAll
          viewAllHref="/posts"
          viewAllLabel="Tous les articles"
        />
      )}

      {/* Any additional blocks from the page */}
      {layout && layout.length > 0 && <RenderBlocks blocks={layout} />}
    </>
  )
}
