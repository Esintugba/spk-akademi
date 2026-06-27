import { useMatches } from 'react-router'
import { SeoHead } from '../../seo/SeoHead'
import {
  breadcrumbSchema,
  canonicalForPath,
  faqSchema,
  organizationSchema,
  websiteSchema,
  type JsonLd,
} from '../../seo/seoUtils'
import { branding, resolveRouteTitle } from '../config/branding'

type SeoHandle = {
  seo?: {
    title?: string
    description?: string
    keywords?: string
    image?: string
    noIndex?: boolean
  }
}

function buildDefaultSchema(pathname: string, title?: string): JsonLd | undefined {
  if (pathname === '/') {
    return [organizationSchema(), websiteSchema()]
  }

  const breadcrumb = breadcrumbSchema([
    { name: 'Ana Sayfa', path: '/' },
    { name: title ?? 'Sayfa', path: pathname },
  ])

  if (pathname === '/faq') {
    return [
      breadcrumb,
      faqSchema([
        {
          question: 'SPK Akademi hangi içerikleri sunar?',
          answer: 'SPK Akademi lisans hazırlığı için ders notları, soru bankası, deneme sınavları ve çalışma takibi sunar.',
        },
        {
          question: 'Lisans kapsamları güncel mi?',
          answer: 'Lisans katalog bilgileri backend üzerinden dinamik olarak hesaplanır ve içerik güncellendikçe yenilenir.',
        },
      ]),
    ]
  }

  if (['/plans', '/blog', '/about', '/contact'].includes(pathname)) {
    return breadcrumb
  }

  return undefined
}

export function DocumentTitleManager() {
  const matches = useMatches()
  const activeHandle = [...matches]
    .reverse()
    .find((match) => Boolean((match.handle as SeoHandle | undefined)?.seo))

  const seo = (activeHandle?.handle as SeoHandle | undefined)?.seo
  const pathname = matches[matches.length - 1]?.pathname ?? window.location.pathname
  const routeTitle = seo?.title ?? resolveRouteTitle(pathname)
  const description = seo?.description ?? branding.defaultDescription
  const keywords = seo?.keywords ?? branding.defaultKeywords
  const canonicalUrl = canonicalForPath(pathname)
  const schema = buildDefaultSchema(pathname, routeTitle)
  const isPrivateRoute = [
    '/admin',
    '/dashboard',
    '/my-courses',
    '/my-trials',
    '/profile',
    '/quiz',
    '/reviews',
    '/reports',
    '/trials',
    '/study',
    '/materials',
    '/questions/past-exams',
    '/gamification',
    '/goals',
    '/leaderboard',
    '/onboarding',
    '/login',
    '/register',
  ].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))

  return (
    <SeoHead
      canonical={canonicalUrl}
      description={description}
      image={seo?.image}
      keywords={keywords}
      noIndex={seo?.noIndex ?? isPrivateRoute}
      schema={schema}
      title={routeTitle}
    />
  )
}
