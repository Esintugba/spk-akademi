# Dynamic License Catalog Feature

## Architecture

- `GET /api/licenses/catalog` returns the full Plans-page catalog from backend projections.
- `GET /api/licenses/catalog/{slug}` powers SEO-friendly `/licenses/:slug` detail pages.
- `GET /api/licenses/{id}` now returns the same rich catalog detail for authenticated callers.
- `LicenseCatalogRepository` uses `AsNoTracking` and projection queries to compute course, topic, question, quiz, material, and analytics counts.
- `LicenseCatalogService` caches the active catalog in `IMemoryCache` and decorates per-user `HasAccess` after the cached read.

## Cache Strategy

- Cache key: `license-catalog:active:v1`
- Absolute TTL: 10 minutes
- Sliding TTL: 2 minutes
- Redis can replace `IMemoryCache` behind the same `ILicenseCatalogService` contract for multi-node deployments.

## Cache Invalidation

`ILicenseCatalogCache.Invalidate()` is called after:

- license create/update/delete
- course create/update/delete
- topic create/update/delete
- question create/update/delete
- question import completion
- trial exam create/update/delete
- material/source document create/update/delete/file replace/text extraction

## SQL Index Suggestions

```sql
CREATE INDEX IX_Licenses_IsActive_DisplayOrder
ON Licenses (IsActive, DisplayOrder);

CREATE INDEX IX_Licenses_IsFeatured_IsActive_DisplayOrder
ON Licenses (IsFeatured, IsActive, DisplayOrder);

CREATE INDEX IX_Courses_LicenseId_Order
ON Courses (LicenseId, "Order");

CREATE INDEX IX_TrialExams_LicenseId_IsPublished_DifficultyLevel
ON TrialExams (LicenseId, IsPublished, DifficultyLevel);
```

## Frontend

- `/plans` uses TanStack Query and renders only API-provided license catalog data.
- `/licenses/:slug` displays the full dynamic license detail.
- `licenseCatalogStore` keeps optional compare selections client-side without duplicating curriculum content.

## Performance Notes

- Response compression is already enabled in `Program.cs`.
- The catalog query is optimized for read-only projection.
- Client queries use 5-minute stale time to reduce repeat calls while preserving admin-driven invalidation server-side.
