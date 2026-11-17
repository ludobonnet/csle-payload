'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState, useCallback } from 'react'

import type { Header, Category } from '@/payload-types'

import { Logo } from '@/components/Logo/Logo'
import { HeaderNav } from './Nav'
import { MobileMenu } from './MobileMenu'

interface HeaderClientProps {
  data: Header
  categories: Category[]
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data, categories }) => {
  const [isSticky, setIsSticky] = useState(false)
  const { headerTheme, setHeaderTheme } = useHeaderTheme()
  const pathname = usePathname()
  // Menu mobile ouvert « pour » une page donnée : il se referme de lui-même au changement de route
  const [mobileMenuPath, setMobileMenuPath] = useState<string | null>(null)
  const isMobileMenuOpen = mobileMenuPath === pathname
  const theme = headerTheme

  // Thème d'en-tête remis à zéro à chaque page (contexte partagé, donc système externe)
  useEffect(() => {
    setHeaderTheme(null)
  }, [pathname, setHeaderTheme])

  // Sticky header on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      setIsSticky(scrollTop > 100)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuPath((open) => (open === pathname ? null : pathname))
  }, [pathname])

  return (
    <header
      className={`
        w-full z-50 transition-all duration-300
        ${
          isSticky
            ? 'fixed top-0 left-0 right-0 bg-background/95 backdrop-blur-md border-b border-border shadow-sm'
            : 'relative'
        }
      `}
      {...(theme ? { 'data-theme': theme } : {})}
    >
      <div className="container">
        <div
          className={`flex justify-between items-center ${isSticky ? 'py-4' : 'py-8'} transition-all duration-300`}
        >
          <Link href="/" className="relative z-50">
            <Logo
              className={`text-foreground transition-all duration-300 ${isSticky ? 'text-2xl' : 'text-3xl'}`}
            />
          </Link>

          {/* Desktop navigation */}
          <div className="hidden md:block">
            <HeaderNav data={data} categories={categories} />
          </div>

          {/* Mobile menu */}
          <MobileMenu
            data={data}
            categories={categories}
            isOpen={isMobileMenuOpen}
            onToggle={toggleMobileMenu}
          />
        </div>
      </div>

      {/* Spacer when header is fixed to prevent content jump */}
      {isSticky && <div className="h-[72px]" aria-hidden="true" />}
    </header>
  )
}
