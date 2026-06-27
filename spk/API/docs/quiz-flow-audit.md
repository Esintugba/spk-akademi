# Quiz Flow Audit

## Scope

Quiz start/generation entry points:

- `QuizzesController`
- `CoursePracticeController`
- `PastExamQuizzesController`
- `WrongAnswersController`
- `PublicContentController`

## Current Controller Ownership

| Flow | Controller | Service | Persistence |
| --- | --- | --- | --- |
| Standard practice | `QuizzesController` | `IQuizAttemptService` | `IQuizGenerationService` -> `IQuizAttemptRepository` |
| Free trial | `QuizzesController` | `IQuizAttemptService` | `IQuizGenerationService` -> `IQuizAttemptRepository` |
| Licensed trial | `QuizzesController` | `IQuizTrialService` | `IQuizGenerationService` -> `IQuizAttemptRepository` |
| Course practice | `CoursePracticeController` | `ICoursePracticeService` | `IQuizGenerationService` -> `IQuizAttemptRepository` |
| Past exam quiz | `PastExamQuizzesController` | `IPastExamQuizService` | `IQuizGenerationService` -> `IQuizAttemptRepository` |
| Wrong answers quiz | `WrongAnswersController` | `IWrongAnswerService` | `IQuizGenerationService` -> `IQuizAttemptRepository` |
| Public mini quiz | `PublicContentController` | `IPublicContentService` | Stateless, no `QuizAttempt` |

Controllers are mostly thin and no longer create attempts directly. The remaining duplication lives mostly in strategy-specific services.

## Repeated Business Logic Found

Before this pass, these authenticated services repeated `QuizAttempt` creation:

- `QuizAttemptService`
- `QuizTrialService`
- `CoursePracticeService`
- `PastExamQuizService`
- `WrongAnswerService`

Repeated logic included:

- `QuizAttemptStatus.Started`
- `StartedAt` and `LastActivityAt`
- `TotalQuestions`
- `AttemptQuestions` ordering
- `QuizAttempts.Add`
- `SaveChanges`
- generated filter JSON serialization
- `72 seconds/question`
- min/max generated quiz counts for specialized flows

This has now been centralized in `IQuizGenerationService`.

## Current Central Service

Implemented:

```text
IQuizGenerationService
QuizGenerationService
QuizGenerationRequest
```

Responsibilities now centralized:

- Attempt creation.
- Attempt question ordering.
- Started timestamp and activity timestamp.
- Started status.
- Total question count.
- Generated filter JSON serialization.
- Past exam / wrong answer generation flags.
- Save through `IQuizAttemptRepository`.
- Shared generated quiz constants:
  - minimum: `5`
  - maximum: `100`
  - seconds per question: `72`

## Current Strategy Layer

Implemented:

```text
IStandardQuizStrategy -> StandardQuizStrategy
ICoursePracticeStrategy -> CoursePracticeStrategy
IPastExamStrategy -> PastExamStrategy
IWrongAnswersStrategy -> WrongAnswersStrategy
```

Selection logic is now explicitly owned by strategy classes:

| Flow | Selection behavior |
| --- | --- |
| Standard practice | Random ID sampling in `StandardQuizStrategy` |
| Free trial | Trial exam ordered question list |
| Course practice | Wrong-answer bias and topic balancing in `CoursePracticeStrategy` |
| Past exams | year/session/exam cap and topic balancing in `PastExamStrategy` |
| Wrong answers | due queue + shuffle without consecutive duplicates in `WrongAnswersStrategy` |
| Public mini quiz | DB-level random ordering, stateless result |

Free trial and public mini quiz are intentionally not in this first strategy pass:

- Free trial uses fixed trial exam ordering.
- Public mini quiz is stateless and does not create `QuizAttempt`.

## Target Architecture

```text
Controller
Service
QuizGenerationService
QuizStrategy
Repository
```

Recommended next interfaces:

```csharp
public interface IQuizGenerationStrategy<TRequest>
{
    Task<QuizGenerationPlan> BuildPlanAsync(
        string userId,
        TRequest request,
        CancellationToken cancellationToken);
}

public sealed record QuizGenerationPlan(
    QuizMode Mode,
    IReadOnlyList<Question> Questions,
    Guid? CourseId,
    Guid? TopicId,
    Guid? TrialExamId,
    object? GeneratedFilters,
    bool GeneratedFromPastExams,
    object? PastExamFilters,
    bool GeneratedFromWrongAnswers);
```

Candidate strategies:

- Completed: `StandardQuizStrategy`
- Completed: `CoursePracticeStrategy`
- Completed: `PastExamStrategy`
- Completed: `WrongAnswersStrategy`
- Future: `FreeTrialQuizStrategy` / `LicensedTrialQuizStrategy` only if trial ordering rules become more complex
- `PublicMiniQuizStrategy` for stateless public quiz generation only

## Repository Needs

Remaining query logic to move or standardize:

- Course topic validation currently still needs repository coverage.
- Past exam question filtering currently lives in `PastExamStrategy`; it can later move behind a repository.
- Wrong answer historical sync and success rate aggregation still use `DataContext` in `WrongAnswerService`.
- Public mini quiz random selection is in `PublicContentRepository` and is acceptable as public/stateless query behavior.

## Public Quiz Boundary

`PublicContentController` / `IPublicContentService` should remain separate from authenticated attempt generation unless a public product explicitly needs persisted anonymous attempts.

Current public mini quiz:

- no `QuizAttempt`
- no progress
- no gamification
- no authenticated ownership
- no correct option ID in start response
- `IsCorrect` and `Explanation` only after submit

## Unit Test Strategy

Add service-level tests for:

- `QuizGenerationService` creates started attempts with ordered attempt questions.
- `QuizGenerationService` serializes generated filter snapshots consistently.
- `QuizAttemptService` standard practice uses generation service.
- `CoursePracticeService` applies wrong-answer bias and topic balancing before generation.
- `PastExamQuizService` enforces exam/year/session distribution.
- `WrongAnswerService` enforces due queue accessibility and minimum question count.
- Public mini quiz never persists attempts.

## Roadmap

1. Completed: centralize authenticated `QuizAttempt` creation in `IQuizGenerationService`.
2. Completed: extract standard random selection into `StandardQuizStrategy`.
3. Completed: extract course practice selection into `CoursePracticeStrategy`.
4. Completed: extract past exam selection into `PastExamStrategy`.
5. Completed: extract wrong answer selection into `WrongAnswersStrategy`.
6. Move remaining service-level EF queries into repositories.
7. Add shared strategy test fixtures for minimum/maximum counts, ordering and access checks.
8. Keep public mini quiz stateless unless product requirements change.
