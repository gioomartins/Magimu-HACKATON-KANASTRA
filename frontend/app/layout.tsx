import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/lib/auth-context'
import { ThemeProvider } from '@/components/theme-provider'
import { I18nProvider } from '@/components/i18n-provider'
import './globals.css'


const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://antecipe.kanastra.com.br'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Antecipe | Antecipação de recebíveis clara e explicada para pequenas empresas',
  description:
    'Antecipação de recebíveis, duplicatas e notas fiscais com decisões claras para pequenas empresas e fundos FIDC. Importar, decidir, explicar e simular.',
  keywords: [
    'antecipação de recebíveis',
    'duplicatas',
    'notas fiscais',
    'FIDC',
    'pequenas empresas',
    'Kanastra',
    'crédito',
  ],
  authors: [{ name: 'Antecipe · Kanastra Hackathon' }],
  creator: 'Antecipe',
  publisher: 'Antecipe',
  applicationName: 'Antecipe',
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: siteUrl,
    title: 'Antecipe | Antecipação de recebíveis clara e explicada para pequenas empresas',
    description:
      'Envie o CSV com milhares de notas fiscais e veja, em segundos, o que o fundo aprova, o que recusa e por quê. Importar. Decidir. Explicar. Simular.',
    siteName: 'Antecipe',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Antecipe — Antecipação de recebíveis clara e explicada para pequenas empresas',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Antecipe | Antecipação de recebíveis clara e explicada para pequenas empresas',
    description:
      'Envie o CSV com milhares de notas fiscais e veja, em segundos, o que o fundo aprova, o que recusa e por quê.',
    images: ['/og-image.png'],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0B2C20',
  colorScheme: 'light dark',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const jsonLdOrg = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Antecipe',
    url: siteUrl,
    logo: `${siteUrl}/icon-512.png`,
    description: 'Plataforma inteligente de antecipação de recebíveis e análise de crédito para fundos FIDC.',
  }

  const jsonLdWebSite = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Antecipe',
    url: siteUrl,
  }

  const jsonLdSoftware = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Antecipe',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'BRL',
    },
  }

  return (
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preload" as="image" href="/animacao-logo-antecipe-poster.jpg" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrg) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSoftware) }}
        />
      </head>
      <body className="min-h-screen bg-stone-50 font-sans antialiased selection:bg-emerald-500 selection:text-white dark:bg-[#0b2c20]">
        <a
          href="#conteudo-principal"
          className="sr-only fixed top-4 left-4 z-50 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-transform focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-white"
        >
          Pular para o conteúdo principal
        </a>
        <ThemeProvider>
          <I18nProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </I18nProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
