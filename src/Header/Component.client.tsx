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
  const [theme, setTheme] = useState<string | null>(null)
  const [isSticky, setIsSticky] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { headerTheme, setHeaderTheme } = useHeaderTheme()
  const pathname = usePathname()

  // Reset header theme on route change
  useEffect(() => {
    setHeaderTheme(null)
    setIsMobileMenuOpen(false)
  }, [pathname, setHeaderTheme])

  // Update theme when headerTheme changes
  useEffect(() => {
    if (headerTheme && headerTheme !== theme) setTheme(headerTheme)
  }, [headerTheme, theme])

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
    setIsMobileMenuOpen((prev) => !prev)
  }, [])

  return (
    <header
      className={`
        w-full z-50 transition-all duration-300
        ${isSticky
          ? 'fixed top-0 left-0 right-0 bg-background/95 backdrop-blur-md border-b border-border shadow-sm'
          : 'relative'
        }
      `}
      {...(theme ? { 'data-theme': theme } : {})}
    >
      <div className="container">
        <div className={`flex justify-between items-center ${isSticky ? 'py-4' : 'py-8'} transition-all duration-300`}>
          <Link href="/" className="relative z-50">
            <Logo
              loading="eager"
              priority="high"
              className={`transition-all duration-300 ${isSticky ? 'h-8' : 'h-10'} w-auto invert dark:invert-0`}
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
