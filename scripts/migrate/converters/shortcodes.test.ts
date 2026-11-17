/**
 * Tests for shortcodes converter - naked video URL handling
 *
 * Run with: pnpm vitest scripts/migrate/converters/shortcodes.test.ts
 */

import { describe, it, expect } from 'vitest'
import { processShortcodes } from './shortcodes.js'

describe('processShortcodes - naked video URLs', () => {
  describe('YouTube URLs', () => {
    it('converts YouTube URL alone in <p> tag', () => {
      const input = '<p>https://www.youtube.com/watch?v=skxMuxO3WcE</p>'
      const result = processShortcodes(input)
      expect(result).toBe(
        '<div data-embed="youtube" data-embed-id="skxMuxO3WcE" data-embed-url="https://www.youtube.com/watch?v=skxMuxO3WcE"></div>'
      )
    })

    it('converts youtu.be short URL in <p> tag', () => {
      const input = '<p>https://youtu.be/skxMuxO3WcE</p>'
      const result = processShortcodes(input)
      expect(result).toBe(
        '<div data-embed="youtube" data-embed-id="skxMuxO3WcE" data-embed-url="https://www.youtube.com/watch?v=skxMuxO3WcE"></div>'
      )
    })

    it('converts YouTube embed URL in <p> tag', () => {
      const input = '<p>https://www.youtube.com/embed/skxMuxO3WcE</p>'
      const result = processShortcodes(input)
      expect(result).toBe(
        '<div data-embed="youtube" data-embed-id="skxMuxO3WcE" data-embed-url="https://www.youtube.com/watch?v=skxMuxO3WcE"></div>'
      )
    })

    it('does NOT convert YouTube URL in middle of paragraph', () => {
      const input = '<p>Regarde cette vidéo https://www.youtube.com/watch?v=skxMuxO3WcE elle est super</p>'
      const result = processShortcodes(input)
      expect(result).toBe(input)
    })

    it('does NOT convert YouTube URL in anchor tag', () => {
      const input = '<p><a href="https://www.youtube.com/watch?v=skxMuxO3WcE">Voir la vidéo</a></p>'
      const result = processShortcodes(input)
      expect(result).toBe(input)
    })

    it('handles YouTube URL with extra parameters', () => {
      const input = '<p>https://www.youtube.com/watch?v=skxMuxO3WcE&t=120</p>'
      const result = processShortcodes(input)
      expect(result).toBe(
        '<div data-embed="youtube" data-embed-id="skxMuxO3WcE" data-embed-url="https://www.youtube.com/watch?v=skxMuxO3WcE"></div>'
      )
    })
  })

  describe('Vimeo URLs', () => {
    it('converts Vimeo URL alone in <p> tag', () => {
      const input = '<p>https://vimeo.com/123456789</p>'
      const result = processShortcodes(input)
      expect(result).toBe(
        '<div data-embed="vimeo" data-embed-id="123456789" data-embed-url="https://vimeo.com/123456789"></div>'
      )
    })

    it('converts Vimeo URL with www', () => {
      const input = '<p>https://www.vimeo.com/123456789</p>'
      const result = processShortcodes(input)
      expect(result).toBe(
        '<div data-embed="vimeo" data-embed-id="123456789" data-embed-url="https://vimeo.com/123456789"></div>'
      )
    })

    it('does NOT convert Vimeo URL in middle of text', () => {
      const input = '<p>Voir https://vimeo.com/123456789 pour plus</p>'
      const result = processShortcodes(input)
      expect(result).toBe(input)
    })
  })

  describe('Dailymotion URLs', () => {
    it('converts Dailymotion URL alone in <p> tag', () => {
      const input = '<p>https://www.dailymotion.com/video/x8abc12</p>'
      const result = processShortcodes(input)
      expect(result).toBe(
        '<div data-embed="dailymotion" data-embed-id="x8abc12" data-embed-url="https://www.dailymotion.com/video/x8abc12"></div>'
      )
    })

    it('converts dai.ly short URL', () => {
      const input = '<p>https://dai.ly/x8abc12</p>'
      const result = processShortcodes(input)
      expect(result).toBe(
        '<div data-embed="dailymotion" data-embed-id="x8abc12" data-embed-url="https://www.dailymotion.com/video/x8abc12"></div>'
      )
    })
  })

  describe('Non-video URLs', () => {
    it('does NOT convert regular URL in <p> tag', () => {
      const input = '<p>https://example.com/some/page</p>'
      const result = processShortcodes(input)
      expect(result).toBe(input)
    })

    it('does NOT convert non-video domain URL', () => {
      const input = '<p>https://twitter.com/user/status/123</p>'
      const result = processShortcodes(input)
      expect(result).toBe(input)
    })
  })

  describe('Mixed content', () => {
    it('converts multiple naked URLs in separate paragraphs', () => {
      const input = `<p>Intro text</p>
<p>https://www.youtube.com/watch?v=abc123def45</p>
<p>Some text between</p>
<p>https://vimeo.com/987654321</p>
<p>Outro text</p>`

      const result = processShortcodes(input)

      expect(result).toContain('<p>Intro text</p>')
      expect(result).toContain('data-embed="youtube" data-embed-id="abc123def45"')
      expect(result).toContain('<p>Some text between</p>')
      expect(result).toContain('data-embed="vimeo" data-embed-id="987654321"')
      expect(result).toContain('<p>Outro text</p>')
    })

    it('handles URL with whitespace in <p> tag', () => {
      const input = '<p>  https://www.youtube.com/watch?v=skxMuxO3WcE  </p>'
      const result = processShortcodes(input)
      expect(result).toBe(
        '<div data-embed="youtube" data-embed-id="skxMuxO3WcE" data-embed-url="https://www.youtube.com/watch?v=skxMuxO3WcE"></div>'
      )
    })
  })
})

describe('processShortcodes - formes héritées du WordPress csle', () => {
  it('convertit la forme encadrante [youtube]URL[/youtube]', () => {
    const result = processShortcodes('<p>[youtube]https://www.youtube.com/watch?v=iXjNFy4PPIQ[/youtube]</p>')
    expect(result).toContain('data-embed="youtube" data-embed-id="iXjNFy4PPIQ"')
    expect(result).not.toContain('[/youtube]')
  })

  it('convertit la forme encadrante [vimeo]URL[/vimeo]', () => {
    const result = processShortcodes('[vimeo]https://vimeo.com/42403297[/vimeo]')
    expect(result).toContain('data-embed="vimeo" data-embed-id="42403297"')
    expect(result).not.toContain('[/vimeo]')
  })

  it('convertit [su_youtube url=...]', () => {
    const result = processShortcodes('[su_youtube url="https://www.youtube.com/watch?v=y15eqHJmUBQ"]')
    expect(result).toContain('data-embed="youtube" data-embed-id="y15eqHJmUBQ"')
  })

  it('remplace [appbox googleplay ...] par un lien Google Play', () => {
    expect(processShortcodes('[appbox googleplay screenshots com.microsoft.wordament]')).toBe(
      '<p><a href="https://play.google.com/store/apps/details?id=com.microsoft.wordament">Voir l’application sur Google Play</a></p>',
    )
  })

  it('remplace [videojs mp4=...] par un lien vers la vidéo', () => {
    expect(processShortcodes('[videojs mp4="https://exemple.com/teaser.mp4"]')).toBe(
      '<p><a href="https://exemple.com/teaser.mp4">Voir la vidéo</a></p>',
    )
  })

  it('supprime [appbox windowsphone ...] (store fermé)', () => {
    expect(processShortcodes('[appbox windowsphone f07f83eb-a8a4-49fd-8946-c67a9349e062]')).toBe('')
  })

  it('supprime les sondages [polldaddy]', () => {
    expect(processShortcodes('<p>Avant</p>[polldaddy poll=9053488]')).toBe('<p>Avant</p>')
  })
})
