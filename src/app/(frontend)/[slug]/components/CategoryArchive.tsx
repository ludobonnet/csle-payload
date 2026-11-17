import { ArticlesArchive } from '@/components/ArticlesArchive'

import type { Category } from '@/payload-types'

type Props = {
  category: Category
  page?: number
}

/** Rubrique : /culture, puis /culture/page/2… comme sur le WordPress d'origine. */
export function CategoryArchive({ category, page = 1 }: Props) {
  return (
    <ArticlesArchive
      title={category.title}
      basePath={`/${category.slug}`}
      page={page}
      categoryId={category.id}
    />
  )
}
