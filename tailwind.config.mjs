/** @type {import('tailwindcss').Config} */

const serif = "var(--font-newsreader), 'Iowan Old Style', Georgia, serif"
const sans = 'var(--font-archivo), system-ui, sans-serif'

const config = {
  theme: {
    extend: {
      fontFamily: {
        display: [serif],
        serif: [serif],
        sans: [sans],
      },
      // Échelle en quarte (×1,333) à partir de 18px, fluide entre mobile et grand écran.
      // Les titres sont en Newsreader : interlignage serré, graisse moyenne, l'axe opsz fait le reste.
      fontSize: {
        display: [
          'clamp(2.75rem, 1.6rem + 4.6vw, 5.5rem)',
          { lineHeight: '1.02', letterSpacing: '-0.02em', fontWeight: '500' },
        ],
        h1: [
          'clamp(2.25rem, 1.55rem + 2.8vw, 3.75rem)',
          { lineHeight: '1.06', letterSpacing: '-0.015em', fontWeight: '500' },
        ],
        h2: [
          'clamp(1.75rem, 1.35rem + 1.6vw, 2.5rem)',
          { lineHeight: '1.12', letterSpacing: '-0.01em', fontWeight: '500' },
        ],
        h3: ['clamp(1.375rem, 1.2rem + 0.7vw, 1.75rem)', { lineHeight: '1.2', fontWeight: '500' }],
        h4: ['1.25rem', { lineHeight: '1.25', fontWeight: '500' }],
        body: ['1.125rem', { lineHeight: '1.6' }],
        'body-sm': ['1rem', { lineHeight: '1.55' }],
        caption: ['0.875rem', { lineHeight: '1.45' }],
        overline: ['0.8125rem', { lineHeight: '1.3', fontWeight: '600', letterSpacing: '0.01em' }],
      },
      maxWidth: {
        measure: 'var(--measure)',
      },
      typography: () => ({
        DEFAULT: {
          css: [
            {
              '--tw-prose-body': 'var(--ink)',
              '--tw-prose-headings': 'var(--ink)',
              '--tw-prose-lead': 'var(--ink-soft)',
              '--tw-prose-links': 'var(--ink)',
              '--tw-prose-bold': 'var(--ink)',
              '--tw-prose-counters': 'var(--sauge-ink)',
              '--tw-prose-bullets': 'var(--sauge)',
              '--tw-prose-quotes': 'var(--ink)',
              '--tw-prose-quote-borders': 'var(--sauge)',
              '--tw-prose-captions': 'var(--ink-soft)',
              '--tw-prose-code': 'var(--ink)',
              '--tw-prose-hr': 'var(--sauge)',
              '--tw-prose-th-borders': 'var(--line)',
              '--tw-prose-td-borders': 'var(--line)',
              maxWidth: 'var(--measure)',
              fontFamily: serif,
              fontSize: '1.1875rem',
              lineHeight: '1.65',
              p: { marginTop: '1.1em', marginBottom: '1.1em' },
              'h1, h2, h3, h4': {
                fontFamily: serif,
                fontWeight: '500',
                letterSpacing: '-0.01em',
              },
              h1: {
                fontSize: '2.25em',
                lineHeight: '1.1',
                marginTop: '1.5em',
                marginBottom: '0.5em',
              },
              h2: {
                fontSize: '1.6em',
                lineHeight: '1.15',
                marginTop: '1.8em',
                marginBottom: '0.6em',
              },
              h3: {
                fontSize: '1.3em',
                lineHeight: '1.25',
                marginTop: '1.6em',
                marginBottom: '0.5em',
              },
              h4: { fontSize: '1.1em', marginTop: '1.5em', marginBottom: '0.4em' },
              strong: { fontWeight: '600' },
              blockquote: {
                fontStyle: 'italic',
                fontSize: '1.25em',
                lineHeight: '1.45',
                borderLeftWidth: '0.4375rem',
                borderLeftColor: 'var(--sauge)',
                paddingLeft: '1.25em',
                marginTop: '1.75em',
                marginBottom: '1.75em',
              },
              'blockquote p:first-of-type::before': { content: 'none' },
              'blockquote p:last-of-type::after': { content: 'none' },
              a: { fontWeight: 'inherit' },
              'ul > li::marker': { color: 'var(--sauge)' },
              img: { marginTop: '0', marginBottom: '0' },
              figure: { marginTop: '2.25em', marginBottom: '2.25em' },
              figcaption: { marginTop: '0.75em' },
              code: { fontWeight: '400' },
            },
          ],
        },
        lg: {
          css: [
            {
              fontSize: '1.25rem',
              lineHeight: '1.65',
            },
          ],
        },
      }),
    },
  },
}

export default config
