# Quiz Catalog Feature

## Architecture

- Backend uses `TrialExam` as the catalog quiz aggregate and exposes student-safe projections through `IQuizCatalogService`.
- Access rules are enforced before projection: quizzes must be active, published, approved, not soft deleted, and either free, purchased, or attached to an active student license.
- Query paths use `AsNoTracking`, server-side filtering, pagination, and DTO projection boundaries.
- React uses TanStack Query for cached catalog and recommendation reads, Zustand for filter state, and virtualized rendering for long catalogs.

## Endpoints

- `GET /api/student/quizzes`
- `GET /api/licenses/{licenseId}/quizzes`
- `GET /api/quizzes/{quizId}/overview`
- `GET /api/quizzes/featured`
- `GET /api/student/quizzes/recommended`
- `GET /api/analytics/quizzes`

## Filtering And Sorting

Supported filters:

- `licenseId`
- `courseId`
- `topicId`
- `difficulty`
- `isFree`
- `status`
- `search`

Supported sorting:

- `newest`
- `popular`
- `highest-rated`
- `shortest-duration`
- `highest-success-rate`

## Index Suggestions

```sql
CREATE INDEX IX_TrialExams_License_Published_Difficulty
ON TrialExams (LicenseId, IsPublished, DifficultyLevel);

CREATE INDEX IX_TrialExams_Featured_Published_Popularity
ON TrialExams (IsFeatured, IsPublished, PopularityScore);

CREATE INDEX IX_QuizAttempts_User_Trial_Status
ON QuizAttempts (UserId, TrialExamId, Status);
```

For PostgreSQL full-text search, add a generated `tsvector` from title, description, and tags and index it with GIN.

## Performance Notes

- Catalog responses are page-limited to 50 items.
- Featured and recommendation queries are cached client-side for 5 minutes.
- Catalog query cache is stale after 60 seconds.
- Recommendation service currently ranks featured quizzes by score and popularity; it is ready to be replaced with a personalized model using weak topics and review history.
