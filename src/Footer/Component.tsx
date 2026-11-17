import { getCachedGlobal } from '@/utilities/getGlobals'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Link from 'next/link'
import React from 'react'

import type { Footer } from '@/payload-types'

import { ThemeSelector } from '@/providers/Theme/ThemeSelector'
import { CMSLink } from '@/components/Link'
import { Logo } from '@/components/Logo/Logo'
import { NewsletterSignup } from '@/components/NewsletterSignup'

export async function Footer() {
  const footerData: Footer = await getCachedGlobal('footer', 1)()
  const payload = await getPayload({ config: configPromise })

  // Fetch categories for footer navigation
  const categoriesResult = await payload.find({
    collection: 'categories',
    limit: 6,
    pagination: false,
    sort: 'title',
  })

  // Fetch newsletter form (wrapped in try-catch as form may not exist yet)
  let newsletterForm = null
  try {
    const newsletterFormResult = await payload.find({
      collection: 'forms',
      where: {
        title: {
          equals: 'Newsletter',
        },
      },
      limit: 1,
    })
    newsletterForm = newsletterFormResult.docs[0] || null
  } catch {
    // Newsletter form doesn't exist yet - that's OK
  }

  const navItems = footerData?.navItems || []
  const categories = categoriesResult.docs || []
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-border bg-[oklch(0.18_0.01_30)] text-white/90">
      <div className="container py-12 md:py-16">
        {/* Newsletter section */}
        {newsletterForm && (
          <div className="mb-12 pb-12 border-b border-white/10">
            <div className="max-w-2xl mx-auto text-center">
              <h3 className="font-display text-h3 text-white mb-3">
                Restez connecté
              </h3>
              <p className="text-body-sm text-white/60 mb-6">
                Recevez nos derniers articles et découvertes directement dans votre boîte mail.
              </p>
              <NewsletterSignup form={newsletterForm} />
            </div>
          </div>
        )}

        {/* Main footer grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-8">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <Logo className="text-white" />
            </Link>
            <p className="text-body-sm text-white/60 mb-6 max-w-xs">
              Blog magazine lifestyle et culture. Tourisme, musique, food et belles découvertes depuis 2008.
            </p>
            <ThemeSelector />
          </div>

          {/* Categories column */}
          <div>
            <h3 className="font-display text-h4 text-white mb-4">Catégories</h3>
            <nav className="flex flex-col gap-2">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/${category.slug}`}
                  className="text-body-sm text-white/60 hover:text-primary transition-colors"
                >
                  {category.title}
                </Link>
              ))}
            </nav>
          </div>

          {/* Navigation column */}
          <div>
            <h3 className="font-display text-h4 text-white mb-4">Navigation</h3>
            <nav className="flex flex-col gap-2">
              {navItems.map(({ link }, i) => (
                <CMSLink
                  key={i}
                  {...link}
                  className="text-body-sm text-white/60 hover:text-primary transition-colors"
                />
              ))}
              <Link
                href="/search"
                className="text-body-sm text-white/60 hover:text-primary transition-colors"
              >
                Rechercher
              </Link>
            </nav>
          </div>

          {/* Social & Legal column */}
          <div>
            <h3 className="font-display text-h4 text-white mb-4">Suivez-nous</h3>
            <div className="flex gap-4 mb-6">
              {/* Social icons - replace with actual links when configured */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-primary transition-colors"
                aria-label="Instagram"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-primary transition-colors"
                aria-label="Twitter"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                </svg>
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-primary transition-colors"
                aria-label="Facebook"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
            </div>

            <div className="text-caption text-white/40">
              <Link href="/mentions-legales" className="hover:text-white/60 transition-colors">
                Mentions légales
              </Link>
              <span className="mx-2">·</span>
              <Link href="/confidentialite" className="hover:text-white/60 transition-colors">
                Confidentialité
              </Link>
            </div>
          </div>
        </div>

        {/* Copyright bar */}
        <div className="mt-12 pt-8 border-t border-white/10 text-center">
          <p className="text-caption text-white/40">
            © {currentYear} CSLE. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  )
}
