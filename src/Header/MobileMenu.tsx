'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import type { Header as HeaderType, Category } from '@/payload-types'
import { CMSLink } from '@/components/Link'

interface MobileMenuProps {
  data: HeaderType
  categories: Category[]
  isOpen: boolean
  onToggle: () => void
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ data, categories, isOpen, onToggle }) => {
  const navItems = data?.navItems || []
  const pathname = usePathname()
  const currentCategory = categories.find((cat) => `/${cat.slug}` === pathname)

  return (
    <>
      {/* Hamburger button */}
      <button
        onClick={onToggle}
        className="md:hidden p-2 -mr-2 text-foreground hover:text-primary transition-colors"
        aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile menu overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
            onClick={onToggle}
            aria-hidden="true"
          />

          {/* Menu panel */}
          <div className="fixed top-0 right-0 h-full w-[280px] max-w-[80vw] bg-card border-l border-border z-50 md:hidden animate-in slide-in-from-right duration-300">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex justify-end p-4 border-b border-border">
                <button
                  onClick={onToggle}
                  className="p-2 text-foreground hover:text-primary transition-colors"
                  aria-label="Fermer le menu"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 overflow-y-auto p-6">
                <ul className="space-y-4">
                  {navItems.map(({ link }, i) => (
                    <li key={i} onClick={onToggle}>
                      <CMSLink
                        {...link}
                        appearance="link"
                        className="block text-h4 font-display text-foreground hover:text-primary transition-colors py-2"
                      />
                    </li>
                  ))}
                </ul>

                {/* Categories section in mobile menu */}
                <div className="mt-8 pt-6 border-t border-border">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                    Catégories
                  </h3>
                  <ul className="space-y-3">
                    {categories.map((category) => {
                      const isActive = currentCategory?.id === category.id
                      return (
                        <li key={category.id} onClick={onToggle}>
                          <Link
                            href={`/${category.slug}`}
                            className={`block text-body transition-colors py-1 ${
                              isActive
                                ? 'text-primary font-medium'
                                : 'text-foreground hover:text-primary'
                            }`}
                          >
                            {category.title}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>

                {/* Search link in mobile menu */}
                <div className="mt-8 pt-6 border-t border-border">
                  <Link
                    href="/search"
                    className="flex items-center gap-3 text-body text-foreground hover:text-primary transition-colors"
                    onClick={onToggle}
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
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.3-4.3" />
                    </svg>
                    Rechercher
                  </Link>
                </div>
              </nav>
            </div>
          </div>
        </>
      )}
    </>
  )
}
