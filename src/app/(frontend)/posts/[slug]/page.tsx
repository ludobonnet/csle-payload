import { permanentRedirect } from 'next/navigation'

type Args = {
  params: Promise<{
    slug?: string
  }>
}

// This page handles the redirect from /posts/:slug to /:slug
// The actual content is served by the unified router at /[slug]/page.tsx
export default async function PostRedirect({ params: paramsPromise }: Args) {
  const { slug = '' } = await paramsPromise
  permanentRedirect(`/${slug}`)
}
