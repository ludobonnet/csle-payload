import type { RequiredDataFromCollectionSlug } from 'payload'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { RenderHero } from '@/heros/RenderHero'

type Props = {
  page: RequiredDataFromCollectionSlug<'pages'>
}

export function PageContent({ page }: Props) {
  const { hero, layout } = page

  return (
    <>
      <RenderHero {...hero} />
      <RenderBlocks blocks={layout} />
    </>
  )
}
