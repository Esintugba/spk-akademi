# Legacy App Data Migration

## Summary

The legacy `appDataSlice` global preload has been removed. Authenticated private
routes no longer wait for licenses, courses, topics, notes, questions, source
documents, user license accesses, and trial exams before rendering.

Previous flow:

```text
Login
Private route
8 parallel catalog requests
Global skeleton
Outlet render
```

Current flow:

```text
Login
Private route renders
Page-level query runs only for the active page
Page-level loading or error UI
```

## Removed Global Preload

The removed preload fetched:

```text
licenses
myLicenseAccesses
courses
topics
studyNotes
questions
sourceDocuments
trialExams
```

This data was server state and did not belong in Redux. Redux now remains scoped
to auth/session state.

## Route Data Ownership

| Route | Data owner |
| --- | --- |
| `/gamification` | Gamification page queries only |
| `/reviews/today` | Reviews page queries only |
| `/materials/viewer/:materialId` | Material viewer queries only |
| `/profile` | Profile page data only |
| `/dashboard` | Dashboard summary queries only |
| `/my-courses` | `courses`, `licenses`, `topics` |
| `/quiz` | `topics` |
| `/quizzes` | `courses`, `licenses`, `topics`, plus quiz catalog queries |
| `/admin/licenses` | `licenses` |
| `/admin/courses` | `courses`, `licenses` |
| `/admin/topics` | `courses`, `topics` |
| `/admin/notes` | `studyNotes`, `topics` |
| `/admin/questions` | `questions`, `topics` |
| `/admin/sources` | `sourceDocuments`, `courses` |
| `/admin/trial-exams` | `trialExams`, `licenses`, `questions` |
| `/admin/access` | `licenses`; page owns access/user data |

## Performance Impact

Expected impact:

- Private pages that do not need catalog data avoid up to 8 initial API calls.
- First route render is no longer blocked by unrelated admin/student datasets.
- Memory pressure is reduced because unused catalogs are not copied into Redux.
- React Query cache now owns server data freshness and invalidation.

## Query Strategy

- Server state uses TanStack Query.
- Mutating admin pages invalidate only the affected query keys.
- Global skeleton is removed; route wrappers show page-level loading states.
- Existing query defaults apply: `staleTime: 30_000`, retry with exponential
  backoff, and window-focus refetch.

## Remaining Improvements

- Move route-local query keys into per-domain query key files.
- Convert remaining page-local `useEffect` API fetches to TanStack Query.
- Add route-level code splitting for the large main bundle.
- Add web-vitals measurement for FCP, LCP, TTI, and route transition time.
