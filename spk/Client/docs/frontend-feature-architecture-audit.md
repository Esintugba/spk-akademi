# Frontend Feature Architecture Audit

## Summary

The frontend is in a mixed organization state:

- Newer modules live under `Client/src/features`.
- Legacy pages still live under `Client/src/components/pages`.
- Navigation ownership was split between `components/navigation.ts` and
  `navigation/studentNavigation.tsx`; this has been consolidated under
  `Client/src/shared/navigation`.

Risk level: P2, because the app works but discovery, ownership, and migration
rules were ambiguous.

## Current Counts

Legacy page files under `components/pages`: 37.

Feature modules under `features`: 14.

Current feature directories:

```text
access-requests
contact
course-practice
gamification
import
materials
my-trials
onboarding
past-exams
quiz-catalog
quiz-results
quiz-session
reviews
wrong-answers
```

## Navigation Ownership

Previous:

```text
components/navigation.ts
navigation/studentNavigation.tsx
```

Current:

```text
shared/navigation/adminNavigation.ts
shared/navigation/studentNavigation.tsx
shared/navigation/index.ts
```

Layouts now import navigation from `shared/navigation`.

## Legacy Pages

The following pages still live under `components/pages` and should be migrated
into feature modules:

```text
AboutPage
AdminBlogPage
AdminConsentsPage
BlogDetailPage
BlogPage
ContactPage
CoursesPage
DashboardPage
FaqPage
FeaturesPage
FreeTrialPage
LandingPage
LegalPage
LicenseDetailPage
LicensesPage
LoginPage
ModerationPage
MyCoursesPage
PlansPage
ProfilePage
PublicQuestionBankPage
PublicSeoDetailPage
PublicStudyNotesPage
QuestionsPage
QuizPage
RegisterPage
ReportsPage
SourceDocumentsPage
StudentDashboardPage
StudyNotesPage
SupportPage
TopicStudyPage
TopicsPage
TrialAttemptDetailPage
TrialExamsPage
TrialHistoryPage
UserLicenseAccessesPage
```

## Target Structure

```text
src/
  app/
    router.tsx
    store.ts
    providers/
  features/
    auth/
      pages/
      components/
      hooks/
    courses/
      pages/
      components/
      hooks/
    licenses/
    questions/
    quizzes/
    reviews/
    gamification/
    materials/
    blog/
    admin/
  shared/
    api/
    navigation/
    ui/
    hooks/
    utils/
    types/
```

## Ownership Matrix

| Area | Target feature |
| --- | --- |
| Login, Register, Profile | `features/auth` |
| Licenses, plans, license detail | `features/licenses` |
| Courses, MyCourses | `features/courses` |
| Topics, topic study | `features/topics` |
| Study notes, public study notes | `features/study-notes` |
| Questions, public question bank, moderation | `features/questions` |
| Quiz page, free trial, trial exams, trial history | `features/quizzes` or existing quiz subfeatures |
| Source documents | `features/source-documents` or `features/materials` |
| Blog public/admin | `features/blog` |
| Dashboards and reports | `features/dashboard` / `features/reports` |
| Consents | `features/consents` |
| Static marketing/legal pages | `features/marketing` |

## Migration Roadmap

### Phase 1: Guardrails

- New pages must not be added to `components/pages`.
- New navigation entries must be added under `shared/navigation`.
- New server calls must use `shared/api`.

### Phase 2: Low-Risk Feature Moves

Move self-contained pages first:

```text
ContactPage -> features/contact
AdminConsentsPage -> features/consents
ProfilePage -> features/auth
ReportsPage -> features/reports
```

### Phase 3: Admin CRUD Moves

Move admin CRUD pages into domain feature folders:

```text
LicensesPage -> features/licenses/pages
CoursesPage -> features/courses/pages
TopicsPage -> features/topics/pages
StudyNotesPage -> features/study-notes/pages
QuestionsPage -> features/questions/pages
SourceDocumentsPage -> features/source-documents/pages
TrialExamsPage -> features/quizzes/pages
UserLicenseAccessesPage -> features/access-requests or features/licenses/pages
```

### Phase 4: Public and Student Experience

Move public/student pages:

```text
LandingPage, AboutPage, LegalPage, FaqPage, SupportPage -> features/marketing
PlansPage, LicenseDetailPage -> features/licenses
MyCoursesPage, TopicStudyPage -> features/courses/topics
StudentDashboardPage -> features/dashboard
```

### Phase 5: Remove `components/pages`

After all imports move, delete `components/pages` and keep `components` for truly
shared layout/common UI only.

## Router Guidance

`app/router.tsx` may remain the route composition root, but route elements should
import feature pages from `features/*/pages`. Route wrapper components that own
data loading should eventually move next to the feature they serve.

## Rules For New Work

- Put new page screens under `features/<domain>/pages`.
- Put feature-only components under `features/<domain>/components`.
- Put reusable UI under `shared/ui` or existing `components/common` until that
  folder is migrated.
- Put navigation definitions under `shared/navigation`.
- Do not add new files under `components/pages`.
- Do not add new API modules under `services`.

## Verification

- Navigation was consolidated into `shared/navigation`.
- Layout imports were updated to use `shared/navigation`.
- Existing mixed page organization is documented with a phased migration plan.
