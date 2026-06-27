# API Route Naming Standard

## Summary

API route paths are standardized as kebab-case. Controllers should not use
`[controller]` token routing because it leaks C# class naming into the public API
and creates PascalCase or hyphenless routes.

Current standard:

```text
api/courses
api/study-notes
api/source-documents
api/trial-exams
api/user-license-accesses
api/quizzes/wrong-answers
```

## Rules

- Use explicit route attributes, for example `[Route("api/study-notes")]`.
- Use lowercase kebab-case for every path segment.
- Use plural resource names for collections.
- Use nested resources when the child belongs to the parent aggregate.
- Avoid action names in routes unless the operation is clearly not a resource CRUD action.
- Do not use `[Route("api/[controller]")]` on API controllers.
- Do not introduce PascalCase, camelCase, or hyphenless compound resource names.

## Examples

Preferred:

```text
GET    /api/courses
GET    /api/courses/{id}
GET    /api/study-notes
POST   /api/source-documents/upload
GET    /api/trial-exams/{id}
POST   /api/user-license-accesses
GET    /api/quizzes/wrong-answers
```

Avoid:

```text
/api/Courses
/api/StudyNotes
/api/SourceDocuments
/api/TrialExams
/api/UserLicenseAccesses
/api/userProfile
```

## Audit Result

Legacy `[controller]` token routes were replaced with explicit kebab-case route
prefixes in controllers such as Courses, Quizzes, Licenses, Questions, Topics,
StudyNotes, SourceDocuments, TrialExams, Account, Progress, Plans, Student,
Moderation, Onboarding, Error, and UserLicenseAccesses.

The frontend API client was updated to use the canonical paths:

```text
/api/study-notes
/api/source-documents
/api/trial-exams
/api/user-license-accesses
```

## Migration Notes

This is a public API contract change for clients that still call legacy paths
such as `/api/studynotes`, `/api/sourcedocuments`, `/api/trialexams`, or
`/api/userlicenseaccesses`.

Internal frontend usage has been migrated. If external clients exist, add a
short compatibility window using API versioning or explicit legacy aliases, then
remove aliases after clients migrate.

## Swagger and OpenAPI

Kebab-case paths make Swagger/OpenAPI output easier to scan and reduce generated
client drift. Controller tags may remain domain-oriented, but route paths should
stay independent from C# type names.

## Review Checklist

- New controller routes are explicit and kebab-case.
- New nested action routes are lowercase and kebab-case.
- No `[controller]` token route is introduced.
- Frontend API calls use the canonical route.
- Swagger output exposes only the canonical route unless a deliberate migration
  alias is documented.
