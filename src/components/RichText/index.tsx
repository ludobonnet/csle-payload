import { MediaBlock } from '@/blocks/MediaBlock/Component'
import {
  DefaultNodeTypes,
  SerializedBlockNode,
  SerializedLinkNode,
  type DefaultTypedEditorState,
} from '@payloadcms/richtext-lexical'
import {
  JSXConvertersFunction,
  LinkJSXConverter,
  RichText as ConvertRichText,
} from '@payloadcms/richtext-lexical/react'

import { CodeBlock, CodeBlockProps } from '@/blocks/Code/Component'

import type {
  BannerBlock as BannerBlockProps,
  CallToActionBlock as CTABlockProps,
  EmbedBlock as EmbedBlockProps,
  MediaBlock as MediaBlockProps,
} from '@/payload-types'
import { BannerBlock } from '@/blocks/Banner/Component'
import { EmbedBlock } from '@/blocks/Embed/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { cn } from '@/utilities/ui'

type NodeTypes =
  | DefaultNodeTypes
  | SerializedBlockNode<
      CTABlockProps | MediaBlockProps | BannerBlockProps | CodeBlockProps | EmbedBlockProps
    >

const internalDocToHref = ({ linkNode }: { linkNode: SerializedLinkNode }) => {
  const { value } = linkNode.fields.doc!
  if (typeof value !== 'object') {
    throw new Error('Expected value to be an object')
  }
  const slug = value.slug
  return `/${slug}`
}

type InlineNode = { type?: string; text?: string }

/**
 * Paragraphe « vide » : sans enfant, ou seulement des retours à la ligne et des espaces.
 * La migration WordPress en a laissé un entre chaque paragraphe (`<p><br/></p>`, `<p>&nbsp;</p>`),
 * ce qui doublait les interlignes et décalait le chapeau.
 */
const isBlankParagraph = (children: InlineNode[] | undefined) =>
  !children?.length ||
  children.every(
    (child) => child.type === 'linebreak' || (child.type === 'text' && !child.text?.trim()),
  )

const jsxConverters: JSXConvertersFunction<NodeTypes> = ({ defaultConverters }) => ({
  ...defaultConverters,
  ...LinkJSXConverter({ internalDocToHref }),
  paragraph: ({ node, nodesToJSX }) =>
    isBlankParagraph(node.children as InlineNode[]) ? null : (
      <p>{nodesToJSX({ nodes: node.children })}</p>
    ),
  blocks: {
    banner: ({ node }) => <BannerBlock className="not-prose my-8" {...node.fields} />,
    // Photos et vidéos débordent un peu de la colonne de lecture sur grand écran
    mediaBlock: ({ node }) => (
      <MediaBlock
        className="not-prose my-10 xl:-mx-24"
        {...node.fields}
        enableGutter={false}
        disableInnerContainer={true}
        // Colonne de lecture 40rem, élargie à 52rem (832 px) en xl
        size="(max-width: 832px) 100vw, 832px"
      />
    ),
    // Vidéos YouTube, Vimeo, Dailymotion (198 reprises de WordPress)
    embed: ({ node }) => (
      <EmbedBlock className="not-prose my-10 xl:-mx-24" {...node.fields} disableInnerContainer />
    ),
    code: ({ node }) => <CodeBlock className="not-prose my-8" {...node.fields} />,
    cta: ({ node }) => <CallToActionBlock {...node.fields} />,
  },
})

type Props = {
  data: DefaultTypedEditorState
  enableGutter?: boolean
  enableProse?: boolean
} & React.HTMLAttributes<HTMLDivElement>

export default function RichText(props: Props) {
  const { className, enableProse = true, enableGutter = true, ...rest } = props
  return (
    <ConvertRichText
      converters={jsxConverters}
      className={cn(
        'payload-richtext',
        {
          container: enableGutter,
          'max-w-none': !enableGutter && !enableProse,
          'mx-auto prose lg:prose-lg': enableProse,
        },
        className,
      )}
      {...rest}
    />
  )
}
