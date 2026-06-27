# Hook Architecture Audit

## Summary

The frontend had almost no reusable business hooks. Before this change, meaningful custom hook usage was effectively limited to `useQuizSessionNavigate`, while query, mutation, toast, navigation, and cache invalidation logic lived directly in route wrappers and page components.

This creates smart pages: UI components also know query keys, API calls, mutation side effects, toast messages, navigation targets, and invalidation rules.

## Implemented First Step

Added a shared admin catalog hook layer:

- `src/shared/hooks/useAdminCatalogQueries.ts`
- `src/shared/hooks/index.ts`

Moved the router-level admin catalog query ownership into hooks:

- `useLicenses`
- `useCourses`
- `useTopics`
- `useStudyNotes`
- `useQuestions`
- `useSourceDocuments`
- `useTrialExams`
- `useAdminCatalogInvalidation`

`src/app/router.tsx` no longer owns admin catalog query keys, API functions, or direct `invalidateQueries` calls.

## Current Findings

### Query Logic Still In Pages

`useQuery` is still used in about 28 files across pages and features. Highest priority areas:

- `features/gamification`
- `features/reviews`
- `features/quiz-catalog`
- `features/materials`
- `features/wrong-answers`
- `features/my-trials`
- `components/pages/AdminBlogPage.tsx`
- `components/pages/PlansPage.tsx`
- `components/pages/StudentDashboardPage.tsx`

### Mutation Logic Still In Pages

`useMutation` is still used in about 16 files. These usually combine:

- API call
- toast success/error
- cache invalidation
- navigation

Highest priority areas:

- `features/reviews`
- `features/quiz-catalog`
- `features/materials`
- `features/wrong-answers`
- `features/access-requests`
- `features/contact`
- `features/import`
- `components/pages/AdminBlogPage.tsx`
- `components/pages/ContactPage.tsx`

### Cache Invalidation Still Scattered

Direct `invalidateQueries` calls remain in feature pages such as:

- `features/reviews/ReviewSessionPage.tsx`
- `features/quiz-catalog/QuizCatalogPage.tsx`
- `features/quiz-catalog/QuizOverviewPage.tsx`
- `features/wrong-answers/WrongAnswersPage.tsx`
- `features/materials/MaterialViewerPage.tsx`
- `features/contact/AdminContactMessagesPage.tsx`
- `features/access-requests/AdminAccessRequestsPage.tsx`
- `features/access-requests/AccessRequestModal.tsx`
- `components/pages/AdminBlogPage.tsx`

## Target Hook Ownership

### Shared Hooks

Use for cross-feature catalog data and broad application concerns:

- licenses
- courses
- topics
- study notes
- questions
- source documents
- trial exams

### Feature Hooks

Use for feature-owned query and mutation workflows:

```text
features/reviews/hooks
features/quiz-catalog/hooks
features/materials/hooks
features/gamification/hooks
features/wrong-answers/hooks
features/access-requests/hooks
features/contact/hooks
features/import/hooks
```

## Refactor Roadmap

### Phase 1: Query Hooks

Move repeated query definitions into feature hooks:

- `useGamificationProfile`
- `useAchievements`
- `useTodayReviews`
- `useReviewStats`
- `useQuizCatalog`
- `useQuizOverview`
- `useMaterialViewer`
- `useMaterialNotes`
- `useWrongAnswerStats`
- `useMyTrials`

### Phase 2: Mutation Hooks

Move mutations and side effects into hooks:

- `useStartQuiz`
- `useSubmitReviewSession`
- `useStartReviewSession`
- `useCreateMaterialBookmark`
- `useCreateMaterialNote`
- `useStartWrongAnswersQuiz`
- `useRemoveWrongAnswer`
- `useSubmitAccessRequest`
- `useUpdateAccessRequest`
- `usePreviewImport`
- `useStartImport`

### Phase 3: Page Slimming

Pages should keep:

- layout
- rendering
- local UI state
- event wiring

Pages should not keep:

- query keys
- API details
- invalidation rules
- toast policy
- mutation side effects

### Phase 4: Testing

Hook extraction enables focused tests for:

- success/error side effects
- cache invalidation
- navigation decisions
- stale data behavior
- retry and loading policy

## Standard

New server-state work should start as a hook:

```tsx
const { data, isLoading, isError } = useCourses()
```

Not as page-owned query details:

```tsx
useQuery({
  queryKey: ['...'],
  queryFn: api.someCall,
})
```

