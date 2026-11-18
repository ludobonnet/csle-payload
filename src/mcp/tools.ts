import type { MCPPluginConfig } from '@payloadcms/plugin-mcp'
import type { PayloadRequest, Where } from 'payload'
import { z } from 'zod'

import type { Post } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'
import { downloadImage } from './importImage'
import { countBlocks, lexicalToMarkdown, markdownToLexical } from './markdown'

type ToolResult = { content: Array<{ text: string; type: 'text' }> }

const json = (value: unknown): ToolResult => ({
  content: [{ type: 'text', text: JSON.stringify(value, null, 2) }],
})

const adminUrl = (id: number | string) => `${getServerSideURL()}/admin/collections/posts/${id}`

// Champs modifiables par le MCP. `_status` n'en fait jamais partie : tout part en brouillon.
const editableFields = {
  title: z.string().min(1).max(200).optional().describe("Titre de l'article"),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'minuscules, chiffres et tirets')
    .optional()
    .describe("Slug d'URL ; généré depuis le titre s'il est absent"),
  categoryIds: z.array(z.number().int()).optional().describe('IDs de catégories (voir list_taxonomies)'),
  tagIds: z.array(z.number().int()).optional().describe('IDs de tags (voir list_taxonomies)'),
  heroImageId: z.number().int().optional().describe("ID d'un média (voir import_image)"),
  metaTitle: z.string().max(70).optional().describe('Titre SEO'),
  metaDescription: z.string().max(170).optional().describe('Description SEO (150-160 caractères idéalement)'),
}

type EditableInput = {
  categoryIds?: number[]
  heroImageId?: number
  metaDescription?: string
  metaTitle?: string
  slug?: string
  tagIds?: number[]
  title?: string
}

const toPostData = (input: EditableInput, current?: Post): Partial<Post> => {
  const data: Partial<Post> = {}
  if (input.title !== undefined) data.title = input.title
  if (input.slug !== undefined) data.slug = input.slug
  if (input.categoryIds !== undefined) data.categories = input.categoryIds
  if (input.tagIds !== undefined) data.tags = input.tagIds
  if (input.heroImageId !== undefined) data.heroImage = input.heroImageId
  if (input.metaTitle !== undefined || input.metaDescription !== undefined) {
    data.meta = {
      ...(current?.meta ?? {}),
      ...(input.metaTitle !== undefined ? { title: input.metaTitle } : {}),
      ...(input.metaDescription !== undefined ? { description: input.metaDescription } : {}),
    }
  }
  return data
}

const findPost = async (req: PayloadRequest, id?: number, slug?: string): Promise<Post> => {
  if (id === undefined && !slug) throw new Error('Préciser `id` ou `slug`')
  const where: Where = id !== undefined ? { id: { equals: id } } : { slug: { equals: slug } }
  const { docs } = await req.payload.find({
    collection: 'posts',
    where,
    draft: true,
    depth: 1,
    limit: 1,
    overrideAccess: false,
    req,
  })
  if (!docs[0]) throw new Error(`Article introuvable (${id ?? slug})`)
  return docs[0]
}

const summary = (post: Post) => ({
  id: post.id,
  title: post.title,
  slug: post.slug,
  status: post._status,
  updatedAt: post.updatedAt,
  adminUrl: adminUrl(post.id),
})

type McpTool = NonNullable<NonNullable<MCPPluginConfig['mcp']>['tools']>[number]

export const mcpTools: McpTool[] = [
  {
    name: 'search_posts',
    description:
      "Cherche des articles de csle.fr (brouillons compris) par mot du titre ou du slug. Renvoie une liste courte : id, titre, slug, statut, dates. Utile pour éviter les doublons et trouver des liens internes.",
    parameters: {
      query: z.string().max(100).optional().describe('Mot ou expression à chercher dans le titre ou le slug'),
      status: z.enum(['draft', 'published', 'any']).default('any'),
      limit: z.number().int().min(1).max(50).default(20),
    },
    handler: async (args: Record<string, unknown>, req: PayloadRequest): Promise<ToolResult> => {
      const { query, status, limit } = args as { query?: string; status: string; limit: number }
      const and: Where[] = []
      if (query) and.push({ or: [{ title: { like: query } }, { slug: { like: query } }] })
      if (status !== 'any') and.push({ _status: { equals: status } })
      const result = await req.payload.find({
        collection: 'posts',
        where: and.length ? { and } : {},
        draft: true,
        depth: 0,
        limit,
        sort: '-updatedAt',
        select: { title: true, slug: true, _status: true, publishedAt: true, updatedAt: true },
        overrideAccess: false,
        req,
      })
      return json({
        total: result.totalDocs,
        posts: result.docs.map((p) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          status: p._status,
          publishedAt: p.publishedAt,
          updatedAt: p.updatedAt,
        })),
      })
    },
  },
  {
    name: 'get_post',
    description:
      "Lit un article (dernière version, brouillon compris) avec son contenu en Markdown. Images et vidéos intégrées au corps ne sont pas représentées en Markdown : elles sont comptées dans `blocks`. Garder `updatedAt` pour update_post_draft.",
    parameters: {
      id: z.number().int().optional(),
      slug: z.string().optional(),
    },
    handler: async (args: Record<string, unknown>, req: PayloadRequest): Promise<ToolResult> => {
      const { id, slug } = args as { id?: number; slug?: string }
      const post = await findPost(req, id, slug)
      const named = (v: unknown) =>
        Array.isArray(v)
          ? v.map((x) => (typeof x === 'object' && x ? { id: x.id, title: x.title } : { id: x }))
          : []
      return json({
        ...summary(post),
        publishedAt: post.publishedAt,
        categories: named(post.categories),
        tags: named(post.tags),
        heroImageId: typeof post.heroImage === 'object' ? post.heroImage?.id : post.heroImage,
        metaTitle: post.meta?.title,
        metaDescription: post.meta?.description,
        blocks: countBlocks(post.content),
        markdown: post.content ? lexicalToMarkdown(req.payload, post.content as never) : '',
      })
    },
  },
  {
    name: 'create_post_draft',
    description:
      "Crée un article en BROUILLON à partir de Markdown (intertitres ##, **gras**, *italique*, [liens](url), > citations, listes, ---). Ne publie jamais : la mise en ligne se fait dans l'admin. Renvoie l'id et le lien d'admin.",
    parameters: {
      ...editableFields,
      title: z.string().min(1).max(200).describe("Titre de l'article"),
      markdown: z.string().min(1).describe("Corps de l'article en Markdown, sans répéter le titre"),
    },
    handler: async (args: Record<string, unknown>, req: PayloadRequest): Promise<ToolResult> => {
      const input = args as EditableInput & { markdown: string; title: string }
      const post = await req.payload.create({
        collection: 'posts',
        draft: true,
        data: {
          ...toPostData(input),
          title: input.title,
          content: markdownToLexical(req.payload, input.markdown) as Post['content'],
          authors: req.user ? [req.user.id] : [],
          _status: 'draft',
        },
        overrideAccess: false,
        req,
      })
      return json({ created: summary(post) })
    },
  },
  {
    name: 'update_post_draft',
    description:
      "Modifie un article en enregistrant un BROUILLON (un article déjà publié reste en ligne tel quel jusqu'à publication dans l'admin). `expectedUpdatedAt` (valeur lue par get_post) est obligatoire : refus si l'article a changé entre-temps. Refuse de remplacer le corps d'un article qui contient images ou vidéos intégrées.",
    parameters: {
      ...editableFields,
      id: z.number().int(),
      expectedUpdatedAt: z.string().describe('`updatedAt` renvoyé par get_post'),
      markdown: z.string().min(1).optional().describe('Nouveau corps complet en Markdown (remplace l’ancien)'),
    },
    handler: async (args: Record<string, unknown>, req: PayloadRequest): Promise<ToolResult> => {
      const input = args as EditableInput & { expectedUpdatedAt: string; id: number; markdown?: string }
      const current = await findPost(req, input.id)
      if (new Date(current.updatedAt).getTime() !== new Date(input.expectedUpdatedAt).getTime()) {
        throw new Error(
          `L'article a été modifié depuis la lecture (updatedAt actuel : ${current.updatedAt}). Relire avec get_post avant de modifier.`,
        )
      }
      const data = toPostData(input, current)
      if (input.markdown !== undefined) {
        const blocks = countBlocks(current.content)
        if (Object.keys(blocks).length > 0) {
          throw new Error(
            `Corps non remplacé : l'article contient des blocs sans équivalent Markdown (${JSON.stringify(blocks)}). Modifier le texte dans l'admin.`,
          )
        }
        data.content = markdownToLexical(req.payload, input.markdown) as Post['content']
      }
      if (Object.keys(data).length === 0) throw new Error('Aucun champ à modifier')
      const post = await req.payload.update({
        collection: 'posts',
        id: input.id,
        draft: true,
        data: { ...data, _status: 'draft' },
        overrideAccess: false,
        req,
      })
      return json({ updated: summary(post), fields: Object.keys(data) })
    },
  },
  {
    name: 'list_taxonomies',
    description:
      "Liste toutes les catégories (id, titre, slug) et cherche des tags par mot (`tagQuery`) : il y a plusieurs centaines de tags, ils ne sont renvoyés que sur recherche.",
    parameters: {
      tagQuery: z.string().min(2).max(50).optional().describe('Mot à chercher dans les tags'),
    },
    handler: async (args: Record<string, unknown>, req: PayloadRequest): Promise<ToolResult> => {
      const { tagQuery } = args as { tagQuery?: string }
      const list = async (collection: 'categories' | 'tags', where: Where, limit: number) => {
        const result = await req.payload.find({
          collection,
          where,
          depth: 0,
          limit,
          sort: 'title',
          select: { title: true, slug: true },
          overrideAccess: false,
          req,
        })
        return {
          total: result.totalDocs,
          items: result.docs.map((d) => ({ id: d.id, title: d.title, slug: d.slug })),
        }
      }
      const categories = await list('categories', {}, 200)
      const tags = tagQuery
        ? await list('tags', { or: [{ title: { like: tagQuery } }, { slug: { like: tagQuery } }] }, 30)
        : { total: (await req.payload.count({ collection: 'tags', overrideAccess: false, req })).totalDocs, items: [] }
      return json({
        categories: categories.items,
        tags: tagQuery ? tags.items : `${tags.total} tags : préciser tagQuery pour en chercher`,
      })
    },
  },
  {
    name: 'import_image',
    description:
      "Importe une image depuis une URL publique https (jpeg, png, webp, gif, avif ; 15 Mo max) dans la médiathèque. Renvoie l'id du média, à passer en `heroImageId`. Vérifier les droits d'usage de l'image.",
    parameters: {
      url: z.string().url(),
      alt: z.string().min(1).max(200).describe("Texte alternatif décrivant l'image"),
    },
    handler: async (args: Record<string, unknown>, req: PayloadRequest): Promise<ToolResult> => {
      const { url, alt } = args as { alt: string; url: string }
      const file = await downloadImage(url)
      const media = await req.payload.create({
        collection: 'media',
        data: { alt },
        file,
        overrideAccess: false,
        req,
      })
      return json({ id: media.id, filename: media.filename, url: media.url, alt: media.alt })
    },
  },
]
