import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'unsite.',
  description: 'Une seule personne à la fois. Un sanctuaire numérique.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://unsite.onrender.com'),
  openGraph: {
    title: 'unsite.',
    description: 'Quelqu\'un est ici en ce moment. Une seule personne peut entrer.',
    type: 'website',
    locale: 'fr_FR',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>°</text></svg>",
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#080604',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
