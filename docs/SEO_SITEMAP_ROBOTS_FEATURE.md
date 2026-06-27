# SEO Sitemap And Robots Feature

## Architecture

- `GET /robots.txt` returns dynamic crawler rules and the configured sitemap URL.
- `GET /sitemap.xml` returns a cached XML sitemap.
- `GET /api/public/seo/{slug}` returns metadata for public license, course, and topic pages.
- `SitemapRepository` uses `AsNoTracking` projection queries for active licenses, courses, and topics.
- `SitemapService` validates paths, blocks private areas, normalizes the configured public base URL, and generates XML with `System.Xml.Linq`.

## Included URLs

- Static: `/`, `/plans`, `/contact`, `/about`, `/privacy`, `/terms`
- Dynamic: `/licenses/{slug}`, `/courses/{slug}`, `/topics/{slug}`

Excluded:

- `/admin/*`
- `/dashboard/*`
- `/auth/*`
- `/quiz/*`
- `/api/*`

## Cache Strategy

- Sitemap cache key: `seo:sitemap:v1`
- Default TTL: 30 minutes, configurable through `Seo:SitemapCacheMinutes`
- `ISeoCache.Invalidate()` is called on license, course, and topic create/update/delete.
- Redis can replace the current `IMemoryCache` implementation behind the same service contract for multi-node deployments.

## Canonical And Metadata

- `DocumentTitleManager` now manages canonical links, robots meta, OpenGraph URL/image/type, and Twitter Card tags.
- Dynamic `/courses/:slug` and `/topics/:slug` routes hydrate their metadata from `/api/public/seo/{slug}`.
- Canonical URLs are based on `VITE_PUBLIC_SITE_URL` in the client and `Seo:PublicBaseUrl` in the API.

## Security

- Sitemap paths must be relative, cannot contain `..`, backslashes, or double slashes.
- Slug metadata lookup accepts only alphanumeric dash slugs.
- The API uses configured `Seo:PublicBaseUrl` instead of trusting arbitrary Host headers, which reduces canonical hijacking risk.

## Performance

- Sitemap XML and robots responses are cacheable for crawlers.
- Response compression includes `application/xml`, `text/xml`, and `text/plain`.
- Dynamic entries use projection and avoid loading full entities.

## SQL Index Suggestions

```sql
CREATE INDEX IX_Licenses_IsActive_Slug
ON Licenses (IsActive, Slug);

CREATE INDEX IX_Courses_Slug_LicenseId
ON Courses (Slug, LicenseId);

CREATE INDEX IX_Topics_Slug_CourseId
ON Topics (Slug, CourseId);
```
