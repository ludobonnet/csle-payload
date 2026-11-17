import { RelatedPosts } from '@/blocks/RelatedPosts/Component'
import RichText from '@/components/RichText'
import { PostHero } from '@/heros/PostHero'
import { AuthorBio } from '@/components/AuthorBio'
import { TagList } from '@/components/TagList'
import { PostNavigation } from '@/components/PostNavigation'
import { ShareButtons } from '@/components/ShareButtons'

import type { Post } from '@/payload-types'

type Props = {
  post: Post
}

/** Article : en-tête, colonne de lecture, puis une fin d'article sobre (partage, auteur, suite). */
export function PostContent({ post }: Props) {
  const firstAuthor = post.populatedAuthors?.[0]
  const related = (post.relatedPosts ?? []).filter(
    (relatedPost): relatedPost is Post => typeof relatedPost === 'object',
  )

  return (
    <>
      <PostHero post={post} />

      <div className="container pt-12 md:pt-16">
        <div className="mx-auto max-w-measure">
          <RichText data={post.content} enableGutter={false} className="prose-chapeau" />

          {/* Fin de l'article : le filet, comme un point final */}
          <div className="mt-14 flex flex-col gap-5">
            <span aria-hidden="true" className="block h-[0.4375rem] w-14 bg-sauge" />
            <ShareButtons
              title={post.title}
              slug={post.slug || ''}
              description={post.meta?.description || undefined}
            />
            {post.tags && post.tags.length > 0 && <TagList tags={post.tags} />}
          </div>

          {firstAuthor && typeof firstAuthor === 'object' && (
            <div className="mt-12">
              <AuthorBio author={firstAuthor} />
            </div>
          )}
        </div>

        {related.length > 0 && (
          <section className="mt-20" aria-labelledby="a-lire-aussi">
            <h2 id="a-lire-aussi" className="filet font-serif text-h2">
              À lire aussi
            </h2>
            <RelatedPosts className="mt-8" docs={related} />
          </section>
        )}

        <div className="mx-auto mt-20 max-w-[60rem]">
          <PostNavigation currentPost={post} />
        </div>
      </div>
    </>
  )
}
