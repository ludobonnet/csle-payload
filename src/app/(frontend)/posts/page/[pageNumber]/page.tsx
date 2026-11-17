import type { Metadata } from 'next/types'

import React from 'react'
import PageClient from './page.client'
import { ArticlesArchive, parsePageNumber } from '@/components/ArticlesArchive'
import { pageTitle } from '@/utilities/site'

export const dynamic = 'force-dynamic'

type Args = {
  params: Promise<{
    pageNumber: string
  }>
}

export default async function Page({ params: paramsPromise }: Args) {
  const { pageNumber } = await paramsPromise
  const page = parsePageNumber(pageNumber, '/posts')

  return (
    <>
      <PageClient />
      <ArticlesArchive title="Tous les articles" basePath="/posts" page={page} />
    </>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { pageNumber } = await paramsPromise
  return {
    title: pageTitle(`Tous les articles, page ${pageNumber}`),
  }
}
