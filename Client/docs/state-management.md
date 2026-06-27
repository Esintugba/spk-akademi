# Frontend State Management Standard

This project uses three state tools intentionally. Each tool has a narrow owner.

## Ownership Matrix

| State type | Owner | Examples |
| --- | --- | --- |
| Server state | TanStack Query | quizzes, licenses, profile, onboarding status, blog, materials, reviews, gamification data |
| UI state | Zustand | modal open state, filters, wizard step, expanded panels, compare selection |
| Auth/session identity | Redux Toolkit | current auth user, auth loading, auth errors, role selectors |

## Rules

1. Backend data should start in TanStack Query.
2. Do not copy query results into Redux or Zustand just to read them elsewhere.
3. Zustand stores must not call API clients or own server loading/error flags.
4. Redux should stay limited to auth/session identity unless a new cross-app client-only state has a strong reason.
5. Mutations that change server state must update or invalidate the relevant query keys.
6. Page-local transient state can stay in `useState` when it is not shared outside the component.

## Current Audit

Redux:

- `authSlice` owns login/register/logout state and role selectors. This is acceptable while Redux remains in the app.
- `appDataSlice` has been removed. Server data such as courses, licenses, topics, notes, questions, source documents and trial exams now loads through route/page-level TanStack Query calls.

Zustand:

- Good UI/session stores: `accessRequestStore`, `quizCatalogStore`, `licenseCatalogStore`, `quizResultStore`, `pastExamStore`, `coursePracticeStore`, `wrongAnswerStore`, `reviewStore`, `quizTrialStore`, `gamificationStore`.
- `gamificationStore` only owns celebration notices. Gamification profile and badge data stay in TanStack Query.
- `quizSessionStore` only owns the resume prompt UI state. Current session and active sessions stay in TanStack Query.
- `onboardingStore` was removed because it duplicated `['onboarding', 'status']` query data.

TanStack Query:

- Used for most newer server state: blog, gamification, reviews, quiz catalog, wrong answers, active sessions, access requests, import jobs, materials and onboarding.
- Query keys are mostly feature-local. Shared query key factories should be introduced before adding more cross-feature invalidation.

## Refactor Plan

1. Keep Redux for auth only.
2. Create `Client/src/shared/queryKeys` or per-domain `*.queryKeys.ts` files for stable keys.
3. Move repeated query logic from pages into hooks such as `useOnboardingStatus`, `usePlans`, `useQuizCatalog`, `useActiveQuizSessions`.
4. Standardize loading and error UI: server state uses `query.isLoading`, `query.isError`, `query.error`; UI state uses Zustand booleans only for client-only interactions.

## Review Checklist

- Does this state come from the API? Use TanStack Query.
- Does this state only control the UI? Zustand is acceptable.
- Does this state identify the authenticated user/session? Redux is acceptable.
- Is the same DTO stored in more than one state system? Refactor before merging.
- Does a mutation affect visible server data? Invalidate or update the matching query key.
