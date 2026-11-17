import type { Metadata } from 'next/types'

import React from 'react'
import PageClient from './page.client'
import { ArticlesArchive } from '@/components/ArticlesArchive'
import { pageTitle } from '@/utilities/site'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <>
      <PageClient />
      <ArticlesArchive title="Tous les articles" basePath="/posts" />
    </>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: pageTitle('Tous les articles'),
  }
}
