import { Helmet } from 'react-helmet-async'
import { branding } from '../shared/config/branding'
import { absoluteUrl, sanitizeUrl, titleForSeo, type JsonLd } from './seoUtils'

interface SeoHeadProps {
  title?: string
  description?: string
  canonical?: string
  image?: string | null
  keywords?: string
  noIndex?: boolean
  ogType?: 'website' | 'article' | 'profile' | string
  schema?: JsonLd | null
}

function compactSchema(schema?: JsonLd | null) {
  if (!schema) {
    return undefined
  }

  const nodes = Array.isArray(schema) ? schema : [schema]
  return nodes.filter(Boolean)
}

export function SeoHead({
  title,
  description = branding.defaultDescription,
  canonical = branding.publicSiteUrl,
  image = branding.defaultImageUrl,
  keywords = branding.defaultKeywords,
  noIndex = false,
  ogType = 'website',
  schema,
}: SeoHeadProps) {
  const resolvedTitle = titleForSeo(title)
  const canonicalUrl = sanitizeUrl(canonical)
  const imageUrl = absoluteUrl(image)
  const robots = noIndex ? 'noindex,nofollow' : 'index,follow'
  const schemaNodes = compactSchema(schema)

  return (
    <Helmet>
      <title>{resolvedTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonicalUrl} />
      <link rel="alternate" hrefLang="tr-TR" href={canonicalUrl} />
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />
      <meta property="og:title" content={resolvedTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content={branding.appName} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={imageUrl} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={resolvedTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="theme-color" content={branding.themeColor} />
      {schemaNodes && (
        <script type="application/ld+json">
          {JSON.stringify(schemaNodes.length === 1 ? schemaNodes[0] : schemaNodes)}
        </script>
      )}
    </Helmet>
  )
}
