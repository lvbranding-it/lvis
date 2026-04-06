import type { MetadataRoute } from 'next'

const BASE = 'https://www.thelvis.com'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE}/services`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE}/auth/login`,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${BASE}/auth/signup`,
      changeFrequency: 'yearly',
      priority: 0.6,
    },
  ]
}
