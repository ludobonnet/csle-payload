import { getCachedGlobal } from '@/utilities/getGlobals'
import { getRubriques } from '@/utilities/getRubriques'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Link from 'next/link'
import React from 'react'

import type { Footer } from '@/payload-types'

import { ThemeSelector } from '@/providers/Theme/ThemeSelector'
import { CMSLink } from '@/components/Link'
import { Logo } from '@/components/Logo/Logo'
import { NewsletterSignup } from '@/components/NewsletterSignup'

const linkClass = 'text-on-brun hover:text-anis transition-colors'

export async function Footer() {
  const payload = await getPayload({ config: configPromise })

  const [footerData, rubriques, newsletterForm] = await Promise.all([
    getCachedGlobal('footer', 1)() as Promise<Footer>,
    getRubriques(),
    // Le formulaire « Newsletter » est facultatif : le bloc n'apparaît que s'il existe
    payload
      .find({ collection: 'forms', where: { title: { equals: 'Newsletter' } }, limit: 1 })
      .then((result) => result.docs[0] || null)
      .catch(() => null),
  ])

  const navItems = footerData?.navItems || []
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-24 bg-brun text-on-brun">
      <div className="container grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-12 lg:gap-10 lg:py-20">
        <div className="lg:col-span-5">
          <p className="max-w-md font-serif text-h3 text-on-brun">
            Voyages, concerts, livres et petites trouvailles du quotidien, racontés à deux voix
            depuis 2008.
          </p>
          {newsletterForm && (
            <div className="mt-8 max-w-md">
              <NewsletterSignup form={newsletterForm} />
            </div>
          )}
        </div>

        <nav aria-label="Rubriques du pied de page" className="lg:col-span-4">
          <p className="filet font-sans font-condensed text-[0.9375rem] font-semibold">Rubriques</p>
          <ul className="mt-5 grid grid-cols-2 gap-x-8 gap-y-2 font-sans text-body-sm">
            {rubriques.map((rubrique) => (
              <li key={rubrique.id}>
                <Link href={`/${rubrique.slug}`} className={linkClass}>
                  {rubrique.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="lg:col-span-3">
          <p className="filet font-sans font-condensed text-[0.9375rem] font-semibold">Le site</p>
          <ul className="mt-5 flex flex-col gap-2 font-sans text-body-sm">
            {navItems.map(({ link }, i) => (
              <li key={i}>
                <CMSLink {...link} className={linkClass} />
              </li>
            ))}
            <li>
              <Link href="/search" className={linkClass}>
                Rechercher un article
              </Link>
            </li>
            <li>
              <Link href="/contact" className={linkClass}>
                Nous écrire
              </Link>
            </li>
            <li>
              <Link href="/mentions-legales" className={linkClass}>
                Mentions légales
              </Link>
            </li>
            <li>
              <Link href="/confidentialite" className={linkClass}>
                Confidentialité
              </Link>
            </li>
          </ul>
          <div className="mt-8">
            <ThemeSelector />
          </div>
        </div>
      </div>

      {/* Bandeau sauge du site d'origine : logo et copyright, texte à l'encre (4,98:1) */}
      <div className="bg-sauge text-[#2a2420]">
        <div className="container flex flex-wrap items-center justify-between gap-4 py-5">
          <Link href="/" aria-label="csle, retour à l'accueil">
            <Logo className="h-6 text-[#2a2420]" title="csle" />
          </Link>
          <p className="font-sans text-caption">© 2008–{currentYear} csle</p>
        </div>
      </div>
    </footer>
  )
}
