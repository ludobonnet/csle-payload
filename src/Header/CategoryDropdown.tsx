'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import type { Category } from '@/payload-types'

interface CategoryDropdownProps {
  categories: Category[]
}

export const CategoryDropdown: React.FC<CategoryDropdownProps> = ({ categories }) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close dropdown on route change
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Check if we're on a category page
  const currentCategory = categories.find(cat => `/${cat.slug}` === pathname)

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary transition-colors py-2"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        Catégories
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className="absolute top-full left-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50"
          onMouseLeave={() => setIsOpen(false)}
        >
          <nav className="py-2">
            {categories.map((category) => {
              const isActive = currentCategory?.id === category.id
              return (
                <Link
                  key={category.id}
                  href={`/${category.slug}`}
                  className={`block px-4 py-2.5 text-sm transition-colors ${
                    isActive
                      ? 'bg-accent text-accent-foreground font-medium'
                      : 'text-foreground hover:bg-accent/50 hover:text-primary'
                  }`}
                >
                  {category.title}
                </Link>
              )
            })}
          </nav>
        </div>
      )}
    </div>
  )
}
