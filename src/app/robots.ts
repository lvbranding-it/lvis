import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/app/', '/auth/', '/api/', '/verify/'],
    },
    sitemap: 'https://www.thelvis.com/sitemap.xml',
  }
}
