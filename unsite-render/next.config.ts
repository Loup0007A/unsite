import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Render déploie en mode standalone pour optimiser l'image Docker
  output: 'standalone',

  // Headers de sécurité globaux
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-Unsite', value: 'one person at a time.' },
        ],
      },
      {
        source: '/robots.txt',
        headers: [{ key: 'Content-Type', value: 'text/plain; charset=utf-8' }],
      },
      {
        source: '/sitemap.xml',
        headers: [{ key: 'Content-Type', value: 'application/xml; charset=utf-8' }],
      },
    ]
  },
}

export default nextConfig
