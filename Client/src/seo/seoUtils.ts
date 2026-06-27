import { branding, buildPageTitle } from '../shared/config/branding'

export type JsonLd = Record<string, unknown> | Array<Record<string, unknown>>

export interface BreadcrumbItem {
  name: string
  path: string
}

export function absoluteUrl(pathOrUrl?: string | null) {
  const fallback = branding.defaultImageUrl
  const value = pathOrUrl?.trim() || fallback

  if (/^https?:\/\//i.test(value)) {
    return sanitizeUrl(value)
  }

  const path = value.startsWith('/') ? value : `/${value}`
  return sanitizeUrl(`${branding.publicSiteUrl.replace(/\/$/, '')}${path}`)
}

export function canonicalForPath(path: string) {
  const cleanPath = path.split('?')[0].split('#')[0] || '/'
  return absoluteUrl(cleanPath)
}

export function sanitizeUrl(url: string) {
  try {
    const parsed = new URL(url, branding.publicSiteUrl)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return branding.publicSiteUrl
    }

    parsed.hash = ''
    return parsed.toString().replace(/\/$/, parsed.pathname === '/' ? '/' : '')
  } catch {
    return branding.publicSiteUrl
  }
}

export function titleForSeo(title?: string) {
  return buildPageTitle(title)
}

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: branding.appName,
    url: absoluteUrl('/'),
    logo: absoluteUrl(branding.defaultImageUrl),
    email: branding.supportEmail,
  }
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: branding.appName,
    url: absoluteUrl('/'),
    potentialAction: {
      '@type': 'SearchAction',
      target: `${absoluteUrl('/blog')}?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

export function courseSchema(input: {
  name: string
  description: string
  path: string
  provider?: string
  courseCount?: number
  topicCount?: number
  questionCount?: number
  estimatedStudyHours?: number
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    provider: {
      '@type': 'Organization',
      name: input.provider ?? branding.appName,
      sameAs: absoluteUrl('/'),
    },
    educationalLevel: 'Professional',
    timeRequired: input.estimatedStudyHours ? `PT${input.estimatedStudyHours}H` : undefined,
    teaches: [
      input.courseCount ? `${input.courseCount} ders` : undefined,
      input.topicCount ? `${input.topicCount} konu` : undefined,
      input.questionCount ? `${input.questionCount} soru` : undefined,
    ].filter(Boolean),
  }
}

export function credentialSchema(input: { name: string; description: string; path: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOccupationalCredential',
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    credentialCategory: 'SPK Lisanslama',
    recognizedBy: {
      '@type': 'Organization',
      name: branding.appName,
    },
  }
}

export function articleSchema(input: {
  title: string
  description: string
  path: string
  image?: string | null
  publishedAt?: string | null
  updatedAt?: string | null
  authorName?: string | null
}) {
  return {
    '@context': 'https://schema.org',
    '@type': ['BlogPosting', 'Article'],
    headline: input.title,
    description: input.description,
    image: input.image ? [absoluteUrl(input.image)] : [absoluteUrl(branding.defaultImageUrl)],
    url: absoluteUrl(input.path),
    mainEntityOfPage: absoluteUrl(input.path),
    datePublished: input.publishedAt,
    dateModified: input.updatedAt ?? input.publishedAt,
    author: {
      '@type': 'Person',
      name: input.authorName ?? branding.appName,
    },
    publisher: {
      '@type': 'Organization',
      name: branding.appName,
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl(branding.defaultImageUrl),
      },
    },
  }
}

export function faqSchema(items: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}
