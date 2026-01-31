import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://afriwiki.vercel.app'

    // Pages statiques
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/recherche`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/a-propos`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/aide`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/conditions`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${baseUrl}/confidentialite`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
    ]

    // Pages des secteurs d'activité
    const sectors = [
        'fintech', 'energie', 'agriculture', 'logistique',
        'sante', 'commerce', 'education', 'immobilier'
    ]

    const sectorPages: MetadataRoute.Sitemap = sectors.map((slug) => ({
        url: `${baseUrl}/secteur/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }))

    // Pages des pays africains
    const countries = [
        'ng', 'ke', 'za', 'gh', 'sn', 'ci', 'bj', 'rw',
        'tz', 'eg', 'ma', 'tn', 'et', 'ug', 'cm', 'dz',
        'ao', 'mz', 'zm', 'zw', 'bw', 'na', 'sz', 'ls',
        'mg', 'mu', 'sc', 'km', 'dj', 'er', 'so', 'sd',
        'ss', 'cf', 'td', 'ne', 'ml', 'bf', 'gn', 'gw',
        'sl', 'lr', 'tg', 'gm', 'cv', 'st', 'gq', 'ga',
        'cg', 'cd', 'bi', 'mw', 'ly', 'mr'
    ]

    const countryPages: MetadataRoute.Sitemap = countries.map((code) => ({
        url: `${baseUrl}/pays/${code}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }))

    return [
        ...staticPages,
        ...sectorPages,
        ...countryPages,
    ]
}
