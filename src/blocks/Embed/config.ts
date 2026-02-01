import type { Block } from 'payload'

export const EmbedBlock: Block = {
  slug: 'embed',
  interfaceName: 'EmbedBlock',
  labels: {
    singular: 'Embed',
    plural: 'Embeds',
  },
  fields: [
    {
      name: 'url',
      type: 'text',
      required: true,
      label: 'URL',
      admin: {
        description: 'URL of the video (YouTube, Vimeo, or Dailymotion)',
      },
    },
    {
      name: 'provider',
      type: 'select',
      required: true,
      options: [
        { label: 'YouTube', value: 'youtube' },
        { label: 'Vimeo', value: 'vimeo' },
        { label: 'Dailymotion', value: 'dailymotion' },
      ],
      admin: {
        description: 'Video provider',
      },
    },
    {
      name: 'embedId',
      type: 'text',
      required: true,
      label: 'Embed ID',
      admin: {
        description: 'Video ID extracted from the URL',
      },
    },
  ],
}
