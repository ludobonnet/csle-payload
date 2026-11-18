// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { isBlocked } from '@/mcp/importImage'

describe('import_image : filtrage des adresses', () => {
  it.each([
    '1.1.1.1',
    '104.26.4.30',
    '172.67.74.163', // Cloudflare : 172.67/16 n'est PAS dans 172.16/12
    '2606:4700::6810:84e5',
    '2a00:1450:4007:80e::200e',
  ])('accepte l’adresse publique %s', (ip) => {
    expect(isBlocked(ip)).toBe(false)
  })

  it.each([
    '127.0.0.1',
    '10.1.2.3',
    '172.16.0.1',
    '172.31.255.255',
    '192.168.1.10',
    '169.254.169.254',
    '100.64.0.1',
    '0.0.0.0',
    '224.0.0.1',
    '::1',
    '::',
    'fe80::1',
    'fd00::1',
    '::ffff:127.0.0.1',
    '::ffff:10.0.0.1',
    '64:ff9b::7f00:1',
    '2002:7f00:1::',
    'pas-une-ip',
  ])('refuse l’adresse interne ou invalide %s', (ip) => {
    expect(isBlocked(ip)).toBe(true)
  })
})
