import { withPayload } from '@payloadcms/next/withPayload'

import redirects from './redirects.js'

const NEXT_PUBLIC_SERVER_URL =
  process.env.NEXT_PUBLIC_SERVER_URL || process.env.__NEXT_PRIVATE_ORIGIN || 'http://localhost:3000'

// Domaine public du bucket R2 des médias (https://images.csle.fr en prod)
const MEDIA_PUBLIC_BASE_URL = process.env.MEDIA_PUBLIC_BASE_URL

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Build autonome : déployé tel quel sur le VPS (systemd + node server.js)
  output: 'standalone',
  images: {
    remotePatterns: [NEXT_PUBLIC_SERVER_URL, MEDIA_PUBLIC_BASE_URL].filter(Boolean).map((item) => {
      const url = new URL(item)

      return {
        hostname: url.hostname,
        protocol: url.protocol.replace(':', ''),
      }
    }),
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  reactStrictMode: true,
  redirects,
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
