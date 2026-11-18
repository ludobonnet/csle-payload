import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

const MAX_BYTES = 15 * 1024 * 1024
const MAX_REDIRECTS = 3
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])

// Refuse les adresses internes : le serveur ne doit pas servir de rebond vers
// le VPS ou son réseau (Postgres, services LSAN, métadonnées…).
const isPrivateAddress = (ip: string): boolean => {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split('.').map(Number)
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    )
  }
  const v6 = ip.toLowerCase()
  if (v6.startsWith('::ffff:')) return isPrivateAddress(v6.slice(7))
  return v6 === '::' || v6 === '::1' || /^f[cd]/.test(v6) || /^fe[89ab]/.test(v6)
}

const assertPublicHttpsUrl = async (raw: string): Promise<URL> => {
  const url = new URL(raw)
  if (url.protocol !== 'https:') throw new Error('Seules les URLs https:// sont acceptées')
  const addresses = await lookup(url.hostname, { all: true })
  if (addresses.length === 0 || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error(`Hôte refusé (adresse interne ou introuvable) : ${url.hostname}`)
  }
  return url
}

export type DownloadedImage = { data: Buffer; mimetype: string; name: string; size: number }

// Télécharge une image publique : https uniquement, redirections revérifiées,
// type et taille contrôlés avant de confier le fichier à Payload.
export const downloadImage = async (rawUrl: string): Promise<DownloadedImage> => {
  let url = await assertPublicHttpsUrl(rawUrl)
  let response: Response | undefined
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(20_000) })
    const location = response.headers.get('location')
    if (response.status >= 300 && response.status < 400 && location) {
      url = await assertPublicHttpsUrl(new URL(location, url).toString())
      continue
    }
    break
  }
  if (!response || !response.ok) throw new Error(`Téléchargement impossible (HTTP ${response?.status})`)

  const mimetype = (response.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase()
  if (!ALLOWED_TYPES.has(mimetype)) throw new Error(`Type non accepté : ${mimetype || 'inconnu'}`)
  const declared = Number(response.headers.get('content-length') ?? 0)
  if (declared > MAX_BYTES) throw new Error('Image trop lourde (15 Mo max)')

  const data = Buffer.from(await response.arrayBuffer())
  if (data.byteLength > MAX_BYTES) throw new Error('Image trop lourde (15 Mo max)')

  const ext = mimetype.split('/')[1].replace('jpeg', 'jpg')
  const base = decodeURIComponent(url.pathname.split('/').pop() ?? '')
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[^a-z0-9-_]+/gi, '-')
    .slice(0, 60)
  return { data, mimetype, name: `${base || 'image'}.${ext}`, size: data.byteLength }
}
