import { describe, expect, it } from 'vitest'

import { applyIntertitres, revertIntertitres } from '@/migrations/data/applyIntertitres'

type Node = { type: string; children?: Node[]; [key: string]: unknown }
const text = (value: string, format = 0): Node => ({ type: 'text', text: value, format })
const paragraph = (...children: Node[]): Node => ({ type: 'paragraph', children })
const doc = (...children: Node[]) => ({ root: { type: 'root', children } as Node })

describe('intertitres rétablis depuis WordPress', () => {
  it('convertit seulement les paragraphes au texte identique, dans l’ordre', () => {
    const content = doc(
      paragraph(text('Introduction.')),
      paragraph(text('Arrivée à Rome', 1)),
      { type: 'block', fields: { blockType: 'mediaBlock' } } as Node,
      paragraph(text('Dimanche : le Colisée')),
    )
    const { content: result, converted } = applyIntertitres(content, [
      { tag: 'h2', text: 'Arrivée à Rome' },
      { tag: 'h3', text: 'Dimanche : le Colisée' },
    ])

    expect(converted).toBe(2)
    const [intro, h2, media, h3] = result.root.children as Record<string, unknown>[]
    expect(intro.type).toBe('paragraph')
    expect(h2).toMatchObject({ type: 'heading', tag: 'h2' })
    // Gras retiré : l'intertitre a déjà sa graisse
    expect((h2.children as { format: number }[])[0].format).toBe(0)
    expect(media.type).toBe('block')
    expect(h3).toMatchObject({ type: 'heading', tag: 'h3' })
  })

  it('saute un intertitre introuvable sans décaler les suivants', () => {
    const { converted } = applyIntertitres(doc(paragraph(text('Deux'))), [
      { tag: 'h2', text: 'Un' },
      { tag: 'h2', text: 'Deux' },
    ])
    expect(converted).toBe(1)
  })

  it('est réversible', () => {
    const intertitres = [{ tag: 'h2' as const, text: 'Arrivée à Rome' }]
    const applied = applyIntertitres(doc(paragraph(text('Arrivée à Rome'))), intertitres)
    const { content, reverted } = revertIntertitres(applied.content, intertitres)
    expect(reverted).toBe(1)
    expect((content.root.children as { type: string }[])[0].type).toBe('paragraph')
  })
})
