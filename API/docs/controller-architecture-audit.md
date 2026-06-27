# Controller Architecture Audit v2

## Scope

This audit tracks backend controller technical debt against the target architecture:

```text
Controller
Service
Repository
DataContext
```

The current codebase contains a mixed architecture. Newer modules already use service/repository boundaries, while several legacy controllers still inject `DataContext` and keep workflow, validation, mapping, query shape and persistence in the HTTP layer.

## Target Standard

Controller responsibilities:

- Accept route/query/body inputs.
- Apply authorization attributes and policies.
- Call one service method per use case when possible.
- Translate service outcomes to HTTP responses.

Controller non-responsibilities:

- EF Core query construction.
- Business workflow.
- Domain authorization decisions that require database data.
- Entity-to-DTO mapping.
- Inline validation beyond simple request presence checks.
- Cache invalidation.
- Side effects such as gamification, import processing or consent persistence.

Service responsibilities:

- Business rules and workflows.
- Domain authorization checks.
- Validation that depends on persisted state.
- Orchestration across repositories and side-effect services.
- Returning typed outcomes, not ad hoc strings.

Repository responsibilities:

- EF Core query shape.
- Persistence.
- Optimized projections.
- `AsNoTracking`, targeted `Include`, pagination and filtering.

## Direct `DataContext` Usage

Controllers currently using `DataContext` directly:

| Priority | Controller | Main debt |
| --- | --- | --- |
| P0 | `QuizzesController` | Partially migrated: start/get/submit workflow moved to `IQuizAttemptService`; remaining catalog/result endpoints still use existing services |
| P1 | `QuestionsController` | Migrated: controller uses `IQuestionService`; EF/query/persistence is behind `IQuestionRepository` |
| P1 | `SourceDocumentsController` | Migrated: controller uses `ISourceDocumentService`; EF/persistence is behind `ISourceDocumentRepository`; local file handling is behind `ISourceDocumentFileStorage` |
| P1 | `AdminImportController` | Migrated: question import uses `IQuestionImportService`; material import uses `IAdminMaterialImportService`; persistence is behind existing source document repository |
| P1 | `AccountController` | Migrated: auth/profile/password/logout workflows use `IAccountService`; registration consent persistence is behind `IConsentLogRepository` |
| P2 | `UserLicenseAccessesController` | Migrated: controller uses `IUserLicenseAccessManagementService`; EF/persistence is behind `IUserLicenseAccessRepository` |
| P2 | `LicensesController` | Migrated: admin CRUD/simple list uses `ILicenseManagementService`; EF/persistence is behind `ILicenseManagementRepository`; catalog endpoints remain on catalog services |
| P2 | `TrialExamsController` | Migrated: admin CRUD/free listing uses `ITrialExamManagementService`; EF/persistence is behind `ITrialExamRepository` |
| P2 | `PublicContentController` | Migrated: public query and mini quiz workflows use `IPublicContentService`; EF/query shape is behind `IPublicContentRepository` |
| P3 | `CoursesController` | Migrated: controller uses `ICourseManagementService`; EF/persistence is behind `ICourseRepository` |
| P3 | `TopicsController` | Migrated: controller uses `ITopicManagementService`; EF/persistence is behind `ITopicRepository` |
| P3 | `StudyNotesController` | Migrated: public/student/admin note workflows use `IStudyNoteManagementService`; EF/persistence is behind `IStudyNoteRepository` |
| P3 | `ConsentsController` / `AdminConsentsController` | Migrated: public consent writes and admin summary reads use consent services; EF/persistence is behind `IConsentLogRepository` |

Controllers mostly aligned with the target pattern:

- `AccessRequestsController`
- `AdminAccessRequestsController`
- `AdminBlogController`
- `AdminContactMessagesController`
- `AdminDashboardController`
- `AnalyticsController`
- `BlogController`
- `ContactController`
- `CoursePracticeController`
- `GamificationController`
- `MaterialsController`
- `ModerationController`
- `OnboardingController`
- `PastExamQuestionsController`
- `PastExamQuizzesController`
- `PlansController`
- `ProgressController`
- `QuizSessionsController`
- `ReviewsController`
- `SeoController`
- `StudentController`
- `WrongAnswersController`

Some aligned controllers still manually translate service errors. That is acceptable short term, but should eventually use shared result mapping.

## Controller Findings

### P0 - `QuizzesController`

Status:

- First extraction completed.
- `QuizzesController` no longer injects `DataContext`.
- DB-backed quiz start/get/submit workflows now go through `IQuizAttemptService`.
- EF Core query and persistence details for these workflows are behind `IQuizAttemptRepository`.

Current issues:

- Controller still manually maps some service outcomes to HTTP responses.
- `IQuizAttemptService` is intentionally broad after the first extraction and can be split further.
- Quiz evaluation, progress orchestration and attempt workflow are now service-level, but can be separated into smaller services in the next pass.
- Some result-detail/catalog endpoints remain in the same controller, although they already use services.

Target services:

- `IQuizAttemptService`
  - `StartPracticeAsync`
  - `StartFreeTrialAsync`
  - `GetAttemptAsync`
  - `CompleteAttemptAsync`
- `IQuizQuestionSelector`
  - `SelectRandomQuestionIdsAsync`
  - future weighted/topic/difficulty distribution support
- `IQuizEvaluationService`
  - answer set validation
  - correct option lookup
  - result answer creation
  - score calculation
- `IQuizProgressOrchestrator`
  - study progress update
  - wrong-answer sync
  - review sync
  - gamification event enqueue
- `IQuizAttemptRepository`
  - attempt graph loading
  - attempt creation
  - completion persistence
- `IQuestionSelectionRepository`
  - filtered question ID queries
  - optimized sampling query support

Recommended first extraction:

1. Completed: move `StartQuiz`, `StartFreeTrialExam`, `GetQuizAttempt` and `SubmitQuiz` into `IQuizAttemptService`.
2. Completed: move `SelectRandomQuestionIdsAsync`, `CanAccessAttempt`, `GetAttemptExpiresAt`, `ToAttemptDto` out of the controller.
3. Next: split `IQuizEvaluationService` from `IQuizAttemptService`.
4. Next: split progress/review/wrong-answer/gamification orchestration into `IQuizProgressOrchestrator`.
5. Next: replace local controller outcome mapping with shared `ServiceResult<T>` mapping.

### P1 - `QuestionsController`

Status:

- Migrated.
- `QuestionsController` no longer injects `DataContext`.
- Listing, detail, create, update and delete now go through `IQuestionService`.
- EF query shape, topic existence checks and persistence now live behind `IQuestionRepository`.
- Option validation, DTO mapping and cache invalidation moved to service layer.

Current issues:

- Controller still maps service outcomes locally.
- FluentValidation validators are still a future improvement; current domain validation lives in `IQuestionService`.

Target services/repositories:

- `IQuestionService`
  - create/update/delete workflow
  - review status decisions
  - cache invalidation orchestration
- `IQuestionRepository`
  - list/detail queries with projections
  - topic existence checks
  - option collection persistence
- `CreateQuestionValidator` / `UpdateQuestionValidator`
  - option count
  - exactly one correct option
  - unique option labels
  - required text/topic fields

### P1 - `SourceDocumentsController`

Status:

- Migrated.
- `SourceDocumentsController` no longer injects `DataContext`.
- List/detail/create/upload/update/replace/extract/text/download/delete now go through `ISourceDocumentService`.
- EF query shape, course existence checks and persistence now live behind `ISourceDocumentRepository`.
- PDF file validation, local path safety, save and delete operations now live behind `ISourceDocumentFileStorage`.
- PDF text extraction orchestration moved to service layer.

Current issues:

- Controller still maps service outcomes locally.
- `ISourceDocumentService` owns a broad workflow surface after the first extraction and can be split further.

Target services/repositories:

- `ISourceDocumentService`
  - document CRUD and access decisions
  - upload workflow orchestration
- `IFileStorageService`
  - store/read/delete document binaries
  - path safety
- `IPdfExtractionService`
  - text extraction boundary
- `ISourceDocumentRepository`
  - query/projection/persistence

### P1 - `AdminImportController`

Status:

- Migrated.
- `AdminImportController` no longer injects `DataContext`.
- Question preview/import/job/duplicate-check remains behind `IQuestionImportService`.
- Material PDF/ZIP import moved to `IAdminMaterialImportService`.
- Material source document persistence goes through `ISourceDocumentRepository`.
- PDF/ZIP local file persistence reuses `ISourceDocumentFileStorage`.

Current issues:

- Controller still maps a single imported material result to `201 Created` locally.
- Material import service can later be split into PDF validator, ZIP reader and import result mapper if it grows.

Target services/repositories:

- `IImportService`
  - queue import jobs
  - read job status
  - coordinate archive import
- `IMaterialImportService`
  - ZIP entry validation
  - PDF extraction
  - document row creation
- `IImportDocumentRepository`
  - source document persistence

### P1 - `AccountController`

Status:

- Migrated.
- `AccountController` no longer injects `DataContext`.
- Register, login, refresh, profile, password change and logout-all now go through `IAccountService`.
- Registration consent persistence now lives behind `IConsentLogRepository`.
- Token creation remains in `ITokenService`.
- Onboarding initialization remains in `IOnboardingService`, orchestrated by `IAccountService`.

Current issues:

- Controller still maps service outcomes locally.
- `IAccountService` still uses Identity directly, which is acceptable as the Identity boundary but can be wrapped further if unit tests need pure mocks.
- Identity result errors are still normalized to a single message string.

Target services:

- `IAuthService`
  - register
  - login
  - refresh
  - logout
- `IUserProfileService`
  - current user
  - profile update
  - password change
- `IConsentService`
  - registration consent recording
- `ITokenService`
  - already exists; keep token generation here

Recommended design:

- Controller calls `authService.RegisterAsync(dto, ipAddress)`.
- Service returns `ServiceResult<AuthResponseDto>`.
- Identity errors become typed error codes.
- Consent recording is transactional with user registration where possible.

### P2 - `UserLicenseAccessesController`

Status:

- Migrated.
- `UserLicenseAccessesController` no longer injects `DataContext`.
- My access listing, user summaries, admin access list/create/update/delete now go through `IUserLicenseAccessManagementService`.
- EF query shape, duplicate checks, license lookup and persistence now live behind `IUserLicenseAccessRepository`.
- Active access calculation remains centralized through `ILicenseAccessService` / `UserLicenseAccessRules`.

Current issues:

- Controller still maps service outcomes locally.
- User summary still uses `UserManager` in the management service because roles are Identity-owned.

Target services/repositories:

- `IUserLicenseAccessService`
  - list accesses
  - create/update/delete
  - duplicate and validity checks
- `IUserLicenseAccessRepository`
  - user/license/access queries

### P2 - `LicensesController`

Status:

- Migrated.
- `LicensesController` no longer injects `DataContext`.
- Public catalog endpoints still use `ILicenseCatalogService`.
- License quiz catalog endpoint still uses `IQuizCatalogService`.
- Simple license list and admin create/update/delete now go through `ILicenseManagementService`.
- EF query shape and persistence now live behind `ILicenseManagementRepository`.
- License catalog and SEO cache invalidation moved to service layer.

Current issues:

- Controller still combines public catalog, quiz catalog and admin management endpoints.
- Controller still maps management service outcomes locally.

Target services:

- `ILicenseCatalogService`
  - public/read-only catalog queries
- `ILicenseManagementService`
  - admin CRUD, cache invalidation
- `ILicenseRepository`
  - persistence and projection

### P2 - `TrialExamsController`

Status:

- Migrated.
- `TrialExamsController` no longer injects `DataContext`.
- Admin list/detail/create/update/delete and free trial listing now go through `ITrialExamManagementService`.
- EF query shape, license existence checks, question existence checks and trial-question relation persistence now live behind `ITrialExamRepository`.
- Question count/duration/question ID validation and DTO mapping moved to service layer.

Current issues:

- Controller still maps service outcomes locally.
- `ITrialExamManagementService` combines admin CRUD and public free listing for now; these can be split if public trial behavior grows.

Target services/repositories:

- `ITrialExamManagementService`
  - admin CRUD
  - free trial listing
  - validation and ordering
- `ITrialExamRepository`
  - projections and question relation persistence
- `CreateTrialExamValidator` / `UpdateTrialExamValidator`

### P2 - `PublicContentController`

Status:

- Migrated.
- `PublicContentController` no longer injects `DataContext`.
- Public question bank, mini quiz start/submit and example trial listing now go through `IPublicContentService`.
- EF query shape, public visibility filters and public DTO projections now live behind `IPublicContentRepository`.
- Mini quiz scoring moved to service layer.
- Public quiz start responses still omit correct answer IDs; submit responses only return `IsCorrect` and `Explanation`.

Current issues:

- Mini quiz service still assumes each approved question has exactly one correct option.
- Public mini quiz abuse controls remain a separate hardening task.

Target services:

- `IPublicContentService`
  - public question bank
  - example trials
- `IPublicMiniQuizService`
  - start mini quiz
  - submit mini quiz
  - safe post-submit explanations only
- `IPublicContentRepository`
  - approved/free/public projections

Important boundary:

- `/api/public/mini-quiz/*` can remain public.
- DB-backed quiz attempts should remain authenticated.

### P3 - `CoursesController`, `TopicsController`, `StudyNotesController`

Status:

- `CoursesController` migrated.
- `CoursesController` no longer injects `DataContext`.
- Course list/detail/create/update/delete now go through `ICourseManagementService`.
- EF query shape, license existence checks and persistence now live behind `ICourseRepository`.
- License catalog and SEO cache invalidation moved to service layer.
- `TopicsController` migrated.
- `TopicsController` no longer injects `DataContext`.
- Topic list/detail/create/update/delete now go through `ITopicManagementService`.
- EF query shape, course existence checks and persistence now live behind `ITopicRepository`.
- `StudyNotesController` migrated.
- `StudyNotesController` no longer injects `DataContext`.
- Public note listing, student/admin listing, detail, create, update and delete now go through `IStudyNoteManagementService`.
- EF query shape, public projections, topic existence checks and persistence now live behind `IStudyNoteRepository`.
- Study note access checks and moderation visibility decisions moved to service/repository boundaries.

Current issues:

- Controller-level service outcome mapping is still local.
- Study note request shape validation still relies on service/domain checks; FluentValidation validators remain a future improvement.

Generic CRUD opportunity:

- These controllers can share a small management service pattern, not necessarily a fully generic repository.
- A generic base can help with create/update/delete boilerplate, but domain-specific access rules must remain explicit.

Recommended shape:

- `ICourseManagementService`
- `ITopicManagementService`
- `IStudyNoteManagementService`
- Shared helpers:
  - `IContentAccessQueryService`
  - `IContentCacheInvalidator`
  - `IEntityExistenceChecker`

Avoid over-generalizing:

- Do not hide domain authorization behind a generic `CrudService<T>`.
- Use generic helpers for repetitive mechanics only.

### P3 - `ConsentsController` and `AdminConsentsController`

Status:

- Migrated.
- `ConsentsController` and `AdminConsentsController` no longer inject `DataContext`.
- Cookie/KVKK consent writes now go through `IConsentService`.
- Admin consent summary reads now go through `IConsentAdminService`.
- Consent persistence, aggregate queries and recent consent projections now live behind `IConsentLogRepository`.

Current issues:

- Consent type strings are still string-based and should become constants or an enum-backed value object.
- Controller still maps the KVKK required outcome locally.

Target services/repositories:

- `IConsentService`
  - record cookie consent
  - record KVKK consent
  - register-time consent
- `IConsentAdminService`
  - consent summaries
- `IConsentRepository`
  - consent log persistence and aggregate queries

## Repeated Patterns To Remove

Inline validation:

- Existence checks such as `TopicId geçersiz`, `CourseId geçersiz`, `LicenseId geçersiz`.
- Option correctness rules.
- Trial exam duration/question count rules.
- Upload extension/size/content checks.
- Identity result string joining.

Manual mapping:

- Static `ToDto` methods in controllers.
- Constructor DTO projections inside actions.
- Repeated summary/detail mapping.

Repeated CRUD:

- `CoursesController`
- `TopicsController`
- `StudyNotesController`
- `LicensesController`
- `TrialExamsController`

Repeated error responses:

- `BadRequest("...")`
- `BadRequest(new { message = "..." })`
- `NotFound()`
- `NotFound(new { message = "..." })`
- `Unauthorized("...")`
- enum outcome mapping repeated per controller

## Standard Result and Error Handling

Introduce a common service result:

```csharp
public sealed record ServiceResult<T>(
    bool Success,
    T? Value,
    ServiceError? Error);

public sealed record ServiceError(
    string Code,
    string Message,
    IReadOnlyDictionary<string, string[]>? Details = null);
```

Controller extension:

```csharp
return result.ToActionResult(this);
```

Standard response envelope:

```json
{
  "success": false,
  "code": "validation_error",
  "message": "...",
  "errors": []
}
```

Keep global exception middleware for unexpected failures. Use service results for expected domain failures.

## Validation Standardization

Use FluentValidation for request shape:

- Required fields.
- String length.
- Numeric ranges.
- Option counts.
- Duplicate labels within request DTOs.
- File metadata where possible.

Use services for domain validation:

- Parent entity exists.
- User has access.
- Duplicate row exists.
- Trial has enough approved questions.
- Attempt belongs to user.
- License access is currently active.

## Mapping Standardization

Use repository projection for read-heavy list endpoints:

- public question bank
- trial summaries
- course/topic/study note lists
- license catalogs

Use AutoMapper/Mapster profiles for repeated entity-to-DTO conversion:

- course/topic/study note CRUD
- source documents
- user license access
- trial exams

Keep service-level mapping only when mapping depends on domain state:

- quiz attempt DTO with shuffled options
- quiz result DTO with post-submit explanations
- active session route generation

## Repository Design

Recommended repositories:

- `IQuizAttemptRepository`
- `IQuestionRepository`
- `IQuestionSelectionRepository`
- `ISourceDocumentRepository`
- `IImportDocumentRepository`
- `IUserLicenseAccessRepository`
- `ILicenseRepository`
- `ITrialExamRepository`
- `IPublicContentRepository`
- `ICourseRepository`
- `ITopicRepository`
- `IStudyNoteRepository`
- `IConsentRepository`

Repository guidelines:

- Return projected DTOs for simple list reads when it reduces mapping and `Include` usage.
- Use `AsNoTracking` for read-only queries.
- Keep write aggregate loading explicit.
- Avoid leaking `IQueryable` to controllers.
- If a service needs composable queries, expose named repository methods instead of raw EF.

## Refactor Roadmap

### Phase 0 - Guardrails

1. Add an architecture rule: new controllers must not inject `DataContext`.
2. Add a lightweight analyzer/test that scans `API/Controllers` for `DataContext`.
3. Add `ServiceResult<T>` and controller result mapping.
4. Add conventions for FluentValidation and mapping profiles.

### Phase 1 - P0 Quiz Extraction

1. Completed: extract `IQuizAttemptService` from `StartQuiz`, `StartFreeTrialExam`, `GetQuizAttempt`, `SubmitQuiz`.
2. Completed: move DB-backed attempt query/persistence methods into `IQuizAttemptRepository`.
3. Next: extract `IQuizEvaluationService` from `IQuizAttemptService.SubmitAsync`.
4. Next: move random question selection to `IQuizQuestionSelector`.
5. Next: move progress/wrong-answer/review/gamification orchestration to a dedicated service.
6. Add unit tests for answer validation, scoring, expiry and ownership.
7. Add integration tests for authenticated start/get/submit and public mini quiz separation.

### Phase 2 - P1 High-Change Controllers

1. Completed: extract `IQuestionService` and `IQuestionRepository`.
2. Next: add FluentValidation validators for question DTO request-shape rules.
3. Completed: extract `ISourceDocumentService`, `ISourceDocumentRepository` and `ISourceDocumentFileStorage`.
4. Completed: finish `AdminImportController` service migration.
5. Completed: split `AccountController` into auth/profile/consent service workflows.

### Phase 3 - P2 Domain Management

1. Completed: extract user license access management.
2. Completed: split license catalog reads from license admin CRUD.
3. Completed: extract trial exam management and validation.
4. Completed: extract public content and public mini quiz services.

### Phase 4 - P3 CRUD Consolidation

1. Completed: extract course/topic/study note services and repositories.
2. Completed: extract `CoursesController` into `ICourseManagementService` and `ICourseRepository`.
3. Completed: extract `TopicsController` into `ITopicManagementService` and `ITopicRepository`.
4. Introduce shared CRUD helper patterns where useful.
5. Completed: extract consent admin/read models.

### Phase 5 - Cleanup and Enforcement

1. Remove controller `ToDto` helpers.
2. Remove inline validation helpers.
3. Normalize error responses.
4. Add test coverage for every migrated service.
5. Completed: `API/Controllers` no longer contains direct `DataContext` injection.

## Unit Test Strategy

High-value unit tests:

- `QuizEvaluationService`
  - duplicate answers rejected
  - foreign question IDs rejected
  - invalid option IDs rejected
  - score counts are correct
  - explanations appear only post-submit
- `QuizAttemptService`
  - only owner can access attempt
  - anonymous DB-backed attempts are rejected
  - expired attempts cannot be submitted
- `QuestionService`
  - option rules
  - topic existence
  - update replaces options correctly
- `SourceDocumentService`
  - upload validation
  - extraction failure handling
  - access decisions
- `AuthService`
  - register always creates Student
  - consent required
  - refresh token invalid cases
- `ConsentService`
  - KVKK and cookie consent are recorded consistently

Integration tests:

- Authenticated quiz start/get/submit.
- Public mini quiz start/submit stays anonymous.
- Anonymous `/api/quizzes/*` DB-backed start/get/submit returns 401/403.
- Admin CRUD endpoints preserve existing behavior after service extraction.
- Error response envelope is consistent.

## Clean Architecture Compatibility

Current blockers:

- Controllers depend on EF Core through `DataContext`.
- Query shape leaks into HTTP actions.
- Domain workflows depend on MVC response methods.
- DTO mapping is scattered.
- Expected failures are represented as strings.

Target compatibility:

- Controllers depend on interfaces only.
- Services own business use cases.
- Repositories own persistence details.
- Validators own request shape validation.
- Error mapping is centralized.
- Tests can cover business behavior without MVC or EF controller setup.

## Production Maintenance Benefits

Expected benefits after migration:

- Smaller controllers.
- Easier unit tests.
- Less endpoint drift in error behavior.
- Easier performance tuning because query shape lives in repositories.
- Safer security changes because authorization and ownership rules are centralized.
- Lower regression risk when quiz, import, content or account workflows change.

## Enforcement Checklist

- No new `DataContext` injection in controllers.
- No new `Include` chains in controllers.
- No new controller-local `ToDto` helpers.
- No new controller-local validation helpers for reusable rules.
- No expected domain error returned as raw string.
- New request DTOs have FluentValidation validators.
- New read-heavy list endpoints use projection.
- New business workflow has unit tests at service level.
