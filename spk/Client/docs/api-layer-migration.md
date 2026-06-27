# Frontend API Layer Migration

## Summary

The legacy `Client/src/services/api.ts` monolith and feature wrapper files have
been removed. API access now flows through `Client/src/shared/api`.

Current architecture:

```text
Pages / hooks / stores
  -> shared/api/*.api.ts
  -> shared/api/client.ts
```

## What Changed

- `services/api.ts` was deleted.
- `services/request.ts` was deleted.
- Feature bridge files such as `services/quizCatalogApi.ts`,
  `services/reviewApi.ts`, and `services/gamificationApi.ts` were deleted.
- `shared/api/client.ts` is now the single axios client with auth token refresh,
  auth invalidation events, toast mapping, and normalized `ApiRequestError`.
- Domain APIs were added under `shared/api`.

## Domain API Files

```text
access-requests.api.ts
auth.api.ts
blog.api.ts
client.ts
consents.api.ts
contact.api.ts
courses.api.ts
dashboard.api.ts
gamification.api.ts
import.api.ts
licenses.api.ts
materials.api.ts
moderation.api.ts
onboarding.api.ts
progress.api.ts
public-content.api.ts
questions.api.ts
quizzes.api.ts
reviews.api.ts
source-documents.api.ts
student.api.ts
study-notes.api.ts
topics.api.ts
trial-exams.api.ts
user-license-accesses.api.ts
```

## Compatibility Facade

`shared/api/index.ts` exports an `api` facade to avoid mixing route migration
with page-level rewrites. The facade does not own endpoint paths; it composes
domain APIs.

Examples:

```text
api.getLicenses -> licensesApi.getAll
api.getCourses -> coursesApi.getAll
api.getQuestions -> questionsApi.getAll
api.getMaterialViewerInfo -> materialsApi.getViewerInfo
```

Feature aliases such as `quizCatalogApi`, `trialQuizApi`, `quizSessionApi`,
`wrongAnswerApi`, and `coursePracticeApi` are also exported from `shared/api`.
They are transitional names backed by `quizzesApi`.

## Ownership Rules

- New endpoint paths must be added only to the relevant `shared/api/*.api.ts`
  domain file.
- Pages should import from `shared/api`, not `services/*`.
- Query lifecycle stays in TanStack Query hooks/pages.
- API modules should only perform HTTP calls and light parameter shaping.
- `shared/api/client.ts` is the only place for axios interceptors, JWT refresh,
  error mapping, and auth-invalid event dispatch.

## Drift Risks Removed

- `/api/licenses` no longer exists in both `services/api.ts` and a shared API
  module.
- Quiz feature wrapper files no longer duplicate or re-export from a separate
  `services` layer.
- Error handling now consistently passes through `shared/api/client.ts`.

## Remaining Improvements

- Replace `api.*` facade usage gradually with domain-specific imports such as
  `licensesApi.getAll()` and `questionsApi.create()`.
- Move query key factories next to domain APIs or into `shared/queryKeys`.
- Consider generating DTOs from OpenAPI once backend contracts stabilize.
