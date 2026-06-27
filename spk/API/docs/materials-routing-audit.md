# Materials Routing Audit

## Previous State

Three controllers owned the same route prefix:

- `MaterialsController`
- `MaterialNotesController`
- `MaterialBookmarksController`

Shared prefix:

```text
api/materials
```

This worked because action templates were distinct, but ownership was unclear and future routes such as `GET /api/materials/{id}` or `GET /api/materials/bookmarks` could become easier to misread or collide with.

## Decision

Use a single aggregate controller for the `api/materials` route area.

Current owner:

```text
api/materials -> MaterialsController
```

Notes and bookmarks are treated as material sub-resources rather than independent top-level resources.

## Current Route Map

```text
GET    /api/materials/{id}/viewer-info
GET    /api/materials/{id}/viewer
POST   /api/materials/progress
GET    /api/materials/reading-history
GET    /api/materials/reading-analytics

GET    /api/materials/{id}/notes
POST   /api/materials/{id}/notes
PATCH  /api/materials/notes/{noteId}
DELETE /api/materials/notes/{noteId}

GET    /api/materials/{id}/bookmarks
POST   /api/materials/{id}/bookmarks
DELETE /api/materials/bookmarks/{bookmarkId}
```

## Authorization

The material route area uses `AuthorizationPolicies.StudentOnly` at controller level. The secure PDF stream endpoint remains `AllowAnonymous` because it is protected by a short-lived stream token.

## Swagger Impact

OpenAPI discovery is now cleaner because all `api/materials` operations are produced by one controller. If the endpoint list grows further, use operation summaries/tags rather than splitting ownership across multiple controllers with the same prefix.

## Future Guideline

Avoid introducing another controller with:

```csharp
[Route("api/materials")]
```

If a resource becomes independent, give it a distinct route prefix such as `api/material-notes` or `api/material-bookmarks`; otherwise keep it under `MaterialsController`.
