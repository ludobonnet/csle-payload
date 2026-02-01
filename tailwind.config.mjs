/** @type {import('tailwindcss').Config} */
const config = {
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-playfair)', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Typography scale from design system
        display: ['4.5rem', { lineHeight: '1.1', fontWeight: '700' }],
        h1: ['3rem', { lineHeight: '1.2', fontWeight: '700' }],
        h2: ['2.25rem', { lineHeight: '1.25', fontWeight: '600' }],
        h3: ['1.875rem', { lineHeight: '1.3', fontWeight: '600' }],
        h4: ['1.5rem', { lineHeight: '1.35', fontWeight: '600' }],
        body: ['1.125rem', { lineHeight: '1.7', fontWeight: '400' }],
        'body-sm': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
        caption: ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
        overline: ['0.75rem', { lineHeight: '1.4', fontWeight: '500', letterSpacing: '0.05em' }],
      },
      typography: () => ({
        DEFAULT: {
          css: [
            {
              '--tw-prose-body': 'var(--foreground)',
              '--tw-prose-headings': 'var(--foreground)',
              '--tw-prose-links': 'var(--primary)',
              '--tw-prose-bold': 'var(--foreground)',
              '--tw-prose-quotes': 'var(--muted-foreground)',
              '--tw-prose-quote-borders': 'var(--primary)',
              '--tw-prose-captions': 'var(--muted-foreground)',
              '--tw-prose-code': 'var(--foreground)',
              '--tw-prose-hr': 'var(--border)',
              maxWidth: '75ch',
              fontSize: '1.125rem',
              lineHeight: '1.7',
              p: {
                marginTop: '1.25em',
                marginBottom: '1.25em',
              },
              h1: {
                fontFamily: 'var(--font-playfair), Georgia, serif',
                fontWeight: '700',
                fontSize: '2.5rem',
                marginTop: '1.5em',
                marginBottom: '0.5em',
              },
              h2: {
                fontFamily: 'var(--font-playfair), Georgia, serif',
                fontWeight: '600',
                fontSize: '1.875rem',
                marginTop: '1.5em',
                marginBottom: '0.5em',
              },
              h3: {
                fontFamily: 'var(--font-playfair), Georgia, serif',
                fontWeight: '600',
                fontSize: '1.5rem',
                marginTop: '1.25em',
                marginBottom: '0.5em',
              },
              h4: {
                fontFamily: 'var(--font-playfair), Georgia, serif',
                fontWeight: '600',
                fontSize: '1.25rem',
              },
              blockquote: {
                fontStyle: 'italic',
                borderLeftWidth: '3px',
                borderLeftColor: 'var(--primary)',
                paddingLeft: '1.5em',
                marginTop: '1.5em',
                marginBottom: '1.5em',
              },
              'blockquote p:first-of-type::before': {
                content: 'none',
              },
              'blockquote p:last-of-type::after': {
                content: 'none',
              },
              hr: {
                borderColor: 'var(--border)',
                marginTop: '2em',
                marginBottom: '2em',
              },
              a: {
                color: 'var(--primary)',
                textDecoration: 'underline',
                textUnderlineOffset: '2px',
                '&:hover': {
                  color: 'var(--primary-hover)',
                },
              },
              figcaption: {
                fontSize: '0.875rem',
                color: 'var(--muted-foreground)',
                marginTop: '0.75em',
              },
            },
          ],
        },
        lg: {
          css: [
            {
              fontSize: '1.25rem',
              h1: {
                fontSize: '3rem',
              },
              h2: {
                fontSize: '2.25rem',
              },
              h3: {
                fontSize: '1.75rem',
              },
            },
          ],
        },
      }),
    },
  },
}

export default config
