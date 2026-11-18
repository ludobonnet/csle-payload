import { lookup as dnsLookup, type LookupAddress } from 'node:dns'
import type { IncomingMessage } from 'node:http'
import { request } from 'node:https'
import { BlockList, isIP, type LookupFunction } from 'node:net'

const MAX_BYTES = 15 * 1024 * 1024
const MAX_REDIRECTS = 3
const TIMEOUT_MS = 20_000
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])

// Tout ce qui n'est pas de l'unicast public : le serveur ne doit pas servir de rebond
// vers le VPS ou son réseau (Postgres, services LSAN, métadonnées…).
const blocked = new BlockList()
for (const [net, prefix] of [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16],
  ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15],
  ['198.51.100.0', 24], ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4],
] as const) blocked.addSubnet(net, prefix, 'ipv4')
for (const [net, prefix] of [
  // Pas de règle ::ffff:0:0/96 : BlockList l'appliquerait à TOUTES les IPv4 ;
  // l'IPv4 encapsulée est traitée dans isBlocked.
  ['::', 128], ['::1', 128], ['64:ff9b::', 96], ['64:ff9b:1::', 48], ['100::', 64],
  ['2001::', 23], ['2001:db8::', 32], ['2002::', 16], ['fc00::', 7], ['fe80::', 10], ['ff00::', 8],
] as const) blocked.addSubnet(net, prefix, 'ipv6')

export const isBlocked = (address: string): boolean => {
  const family = isIP(address)
  if (family === 0) return true
  // IPv4 encapsulée (::ffff:a.b.c.d) : jugée sur son adresse IPv4
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(address)
  if (mapped) return blocked.check(mapped[1], 'ipv4')
  return blocked.check(address, family === 6 ? 'ipv6' : 'ipv4')
}

// Résolution DNS contrôlée AU MOMENT de la connexion : l'adresse vérifiée est celle
// utilisée par la socket (pas de seconde résolution exploitable par DNS rebinding).
const safeLookup: LookupFunction = (hostname, options, callback) => {
  dnsLookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err, '', 0)
    const list = addresses as LookupAddress[]
    const bad = list.find(({ address }) => isBlocked(address))
    if (list.length === 0 || bad) {
      return callback(new Error(`Hôte refusé (adresse interne ou introuvable) : ${hostname}`), '', 0)
    }
    if (options.all) return (callback as unknown as (e: null, a: LookupAddress[]) => void)(null, list)
    callback(null, list[0].address, list[0].family)
  })
}

const get = (url: URL): Promise<IncomingMessage> =>
  new Promise((resolve, reject) => {
    // IP littérale : pas de DNS, vérification directe
    const host = url.hostname.replace(/^\[|\]$/g, '')
    if (isIP(host) && isBlocked(host)) return reject(new Error(`Hôte refusé (adresse interne) : ${host}`))
    const req = request(url, { lookup: safeLookup, timeout: TIMEOUT_MS, headers: { accept: 'image/*' } }, resolve)
    req.on('timeout', () => req.destroy(new Error('Délai de téléchargement dépassé')))
    req.on('error', reject)
    req.end()
  })

// Lecture en flux, interrompue dès que la limite est dépassée
const readCapped = (res: IncomingMessage): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let total = 0
    res.on('data', (chunk: Buffer) => {
      total += chunk.length
      if (total > MAX_BYTES) {
        res.destroy()
        return reject(new Error('Image trop lourde (15 Mo max)'))
      }
      chunks.push(chunk)
    })
    res.on('end', () => resolve(Buffer.concat(chunks)))
    res.on('error', reject)
  })

export type DownloadedImage = { data: Buffer; mimetype: string; name: string; size: number }

// Télécharge une image publique : https uniquement, chaque connexion (redirections
// comprises) vérifiée sur l'adresse réellement contactée, type et taille contrôlés.
export const downloadImage = async (rawUrl: string): Promise<DownloadedImage> => {
  let url = new URL(rawUrl)
  let res: IncomingMessage | undefined
  for (let hop = 0; ; hop++) {
    if (url.protocol !== 'https:') throw new Error('Seules les URLs https:// sont acceptées')
    res = await get(url)
    const status = res.statusCode ?? 0
    if (status >= 300 && status < 400 && res.headers.location) {
      res.resume()
      if (hop >= MAX_REDIRECTS) throw new Error('Trop de redirections')
      url = new URL(res.headers.location, url)
      continue
    }
    if (status < 200 || status >= 300) {
      res.resume()
      throw new Error(`Téléchargement impossible (HTTP ${status})`)
    }
    break
  }

  const mimetype = (res.headers['content-type'] ?? '').split(';')[0].trim().toLowerCase()
  if (!ALLOWED_TYPES.has(mimetype)) {
    res.destroy()
    throw new Error(`Type non accepté : ${mimetype || 'inconnu'}`)
  }
  if (Number(res.headers['content-length'] ?? 0) > MAX_BYTES) {
    res.destroy()
    throw new Error('Image trop lourde (15 Mo max)')
  }
  const data = await readCapped(res)

  const ext = mimetype.split('/')[1].replace('jpeg', 'jpg')
  const base = decodeURIComponent(url.pathname.split('/').pop() ?? '')
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[^a-z0-9-_]+/gi, '-')
    .slice(0, 60)
  return { data, mimetype, name: `${base || 'image'}.${ext}`, size: data.byteLength }
}
