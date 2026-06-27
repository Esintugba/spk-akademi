# Bundle Splitting Audit

## Summary

The production bundle was previously dominated by a single application chunk:

| Metric | Before | After |
| --- | ---: | ---: |
| Main JS chunk | 2,165 KB | 128 KB |
| Main JS gzip | 652 KB | 38 KB |
| Vite >500 KB warning | Yes | No |

The main app shell now loads the router, providers, guards, and shared layout code. Route pages and heavy feature areas are loaded on demand.

## Implemented Changes

- Converted route pages in `src/app/router.tsx` to `React.lazy`.
- Wrapped route elements in `Suspense` with the existing page fallback.
- Split admin, quiz, gamification, review, material, public, and marketing screens into route chunks.
- Added Vite `manualChunks` rules for large vendor groups:
  - `vendor-react`
  - `vendor-query`
  - `vendor-core`
  - `vendor-mui`
  - `vendor-charts`
  - `vendor-pdf`

## Largest Remaining Chunks

| Chunk | Size | Gzip | Notes |
| --- | ---: | ---: | --- |
| `vendor-pdf` | 462 KB | 137 KB | Loaded by material/PDF viewer flows |
| `vendor-mui` | 425 KB | 131 KB | Shared UI dependency |
| `vendor-charts` | 393 KB | 115 KB | Loaded by chart-heavy screens |
| `vendor-react` | 234 KB | 76 KB | React runtime/router |
| `index` | 128 KB | 38 KB | App shell |

`pdf.worker.min` is still a large worker asset at about 1.2 MB. It is no longer part of the main application chunk, but PDF viewer routes should remain lazy and should not be prefetched for normal dashboard or quiz flows.

## Route Loading Policy

- New pages must be added to the router with `lazy(() => import(...))`.
- Admin-only pages must not be eagerly imported by student/public routes.
- PDF, chart, editor, and report-heavy modules should stay behind route or component-level lazy boundaries.
- Avoid global prefetch for admin chunks. Prefer user-intent prefetch only for likely next student flows.

## Verification

- `npm run build`
- `npm run lint`

