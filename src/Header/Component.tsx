import { HeaderClient } from './Component.client'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { getRubriques } from '@/utilities/getRubriques'
import React from 'react'

import type { Header } from '@/payload-types'

export async function Header() {
  const [headerData, rubriques] = await Promise.all([
    getCachedGlobal('header', 1)() as Promise<Header>,
    getRubriques(),
  ])

  return <HeaderClient data={headerData} rubriques={rubriques} />
}
