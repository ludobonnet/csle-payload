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

export function PostContent({ post }: Props) {
  // Get the first author for the bio section
  const authors = post.populatedAuthors
  const firstAuthor = authors && authors.length > 0 ? authors[0] : null

  return (
    <>
      <PostHero post={post} />

      <div className="flex flex-col items-center gap-4 pt-8">
        <div className="container">
          <div className="max-w-[48rem] mx-auto">
            <RichText data={post.content} enableGutter={false} />

            {/* Share Buttons - after content */}
            <ShareButtons
              title={post.title}
              slug={post.slug || ''}
              description={post.meta?.description || undefined}
              className="mt-8 mb-8 pb-8 border-b border-border"
            />

            {/* Tags - after share buttons */}
            {post.tags && post.tags.length > 0 && (
              <TagList tags={post.tags} />
            )}

            {/* Author Bio - after tags, before related posts */}
            {firstAuthor && typeof firstAuthor === 'object' && (
              <AuthorBio author={firstAuthor} />
            )}
          </div>

          {post.relatedPosts && post.relatedPosts.length > 0 && (
            <RelatedPosts
              className="mt-12 max-w-[52rem] lg:grid lg:grid-cols-subgrid col-start-1 col-span-3 grid-rows-[2fr]"
              docs={post.relatedPosts.filter((post) => typeof post === 'object')}
            />
          )}

          {/* Previous/Next Navigation - after related posts */}
          <div className="max-w-[52rem] mx-auto">
            <PostNavigation currentPost={post} />
          </div>
        </div>
      </div>
    </>
  )
}
