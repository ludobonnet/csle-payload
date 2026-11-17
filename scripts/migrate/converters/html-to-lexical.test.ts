/**
 * Tests de conversion des images WordPress en blocs média Lexical.
 *
 * Run with: pnpm vitest run scripts/migrate/converters/html-to-lexical.test.ts
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { convertHtmlToLexical, setMediaMappings } from './html-to-lexical.js'

type Node = { type: string; text?: string; children?: Node[]; fields?: Record<string, unknown> }

const rootChildren = async (html: string) => {
  const { lexical, unresolvedImages } = await convertHtmlToLexical(html)
  return { children: lexical.root.children as Node[], unresolvedImages }
}

const mediaIds = (children: Node[]) =>
  children.filter((n) => n.type === 'block' && n.fields?.blockType === 'mediaBlock').map((n) => n.fields?.media)

const texts = (children: Node[]): string[] =>
  children.flatMap((n) => (n.type === 'text' ? [n.text ?? ''] : texts(n.children ?? [])))

beforeEach(() => {
  // WP attachment 42 → Payload 7 ; chemin « 2010/05/photo.jpg » → Payload 9
  setMediaMappings(new Map([[42, 7]]), new Map([['2010/05/photo.jpg', 9]]))
})

describe('convertHtmlToLexical - images', () => {
  it('transforme une image classée wp-image-ID en bloc média', async () => {
    const { children } = await rootChildren('<p>Avant</p><img class="alignleft wp-image-42" src="x.jpg" /><p>Après</p>')
    expect(mediaIds(children)).toEqual([7])
    expect(texts(children)).toEqual(['Avant', 'Après'])
  })

  it('résout une image par son URL WordPress, taille comprise', async () => {
    const { children } = await rootChildren(
      '<p><a href="http://www.csle.fr/files/2010/05/photo.jpg"><img src="http://www.csle.fr/files/2010/05/photo-300x200.jpg" /></a></p>',
    )
    expect(mediaIds(children)).toEqual([9])
  })

  it('sort l’image d’un paragraphe de texte sans perdre le texte, image en premier', async () => {
    const { children } = await rootChildren('<p><img class="wp-image-42" src="x.jpg" />Un texte autour</p>')
    expect(children[0].fields?.blockType).toBe('mediaBlock')
    expect(texts(children)).toEqual(['Un texte autour'])
  })

  it('garde la légende d’une figure en paragraphe sous l’image', async () => {
    const { children } = await rootChildren(
      '[caption id="attachment_42" align="aligncenter" width="300"]<img class="wp-image-42" src="x.jpg" /> La légende[/caption]',
    )
    expect(mediaIds(children)).toEqual([7])
    expect(texts(children)).toEqual(['La légende'])
  })

  it('convertit les galeries avec ids en suite de blocs média', async () => {
    const { children } = await rootChildren('<p>Intro</p>[gallery ids="42,99"]')
    // 99 est inconnu : ignoré par le résolveur de galerie
    expect(mediaIds(children)).toEqual([7])
  })

  it('retire une image introuvable et la signale', async () => {
    const { children, unresolvedImages } = await rootChildren('<p>Texte</p><p><img src="http://ailleurs.com/a.jpg" /></p>')
    expect(mediaIds(children)).toEqual([])
    expect(unresolvedImages).toEqual([{ src: 'http://ailleurs.com/a.jpg', wpId: null }])
    expect(texts(children)).toEqual(['Texte'])
  })
})
