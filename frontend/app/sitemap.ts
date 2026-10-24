import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://antecipe.kanastra.com.br'
  const now = new Date()

  return [
    {
      url: `${siteUrl}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/plataforma`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ]
}
