# API Error Handling Standard

## Audit Summary

Before this standardization pass, API errors appeared in at least these formats:

- Raw string bodies from `BadRequest("...")` / `NotFound("...")`.
- Anonymous `{ message = "..." }` objects.
- Empty bodies from `NotFound()`, `Unauthorized()` and some `Forbid()` paths.
- Exception middleware responses with only `statusCode`, `message` and optional details.
- ASP.NET Core validation responses using the framework default model-state shape.

This created frontend branching for `error.message`, `response.message`, raw strings, validation dictionaries and empty bodies.

## Standard Response

All error responses should use:

```json
{
  "success": false,
  "statusCode": 400,
  "code": "validation_error",
  "message": "Validation failed.",
  "errors": [
    {
      "field": "email",
      "message": "Email is required."
    }
  ],
  "traceId": "..."
}
```

Implemented model:

- `ApiErrorResponse`
- `ApiValidationError`
- `ApiErrorFactory`
- `ApiErrorResultFilter`

## Codes

| HTTP | Code | Default message |
| --- | --- | --- |
| 400 | `bad_request` / `validation_error` | `Invalid request.` / `Validation failed.` |
| 401 | `unauthorized` | `Authentication is required.` |
| 403 | `forbidden` | `You are not allowed to access this resource.` |
| 404 | `not_found` | `Resource not found.` |
| 409 | `duplicate_resource` | `Resource already exists or conflicts with current state.` |
| 429 | `rate_limited` | `Too many requests. Please try again later.` |
| 500 | `server_error` | `An unexpected error occurred.` |

## Current Enforcement

Centralized coverage now includes:

- Global exception middleware.
- ASP.NET Core model-state / FluentValidation auto-validation failures.
- JWT authentication challenge responses.
- JWT authorization forbidden responses.
- Rate limiter rejections.
- MVC controller error results through `ApiErrorResultFilter`.

The result filter normalizes legacy controller patterns such as:

- `BadRequest("Invalid request")`
- `BadRequest(new { message = "Invalid request" })`
- `NotFound()`
- `Unauthorized()`
- `StatusCode(429, new { message = "..." })`

## Controller Guideline

New code should avoid:

```csharp
return BadRequest("...");
return BadRequest(new { message = "..." });
return NotFound();
return Unauthorized();
return Forbid();
```

Preferred long-term shape:

```csharp
return result.ToActionResult(this);
```

where service errors map to typed error codes. Until a shared `ServiceResult<T>` mapper exists, the global result filter keeps the API contract stable.

## Validation

Request-shape validation should be implemented with FluentValidation where possible. Domain validation should remain in services.

Validation errors are returned as:

```json
{
  "success": false,
  "statusCode": 400,
  "code": "validation_error",
  "message": "Validation failed.",
  "errors": [
    {
      "field": "fieldName",
      "message": "Validation message."
    }
  ],
  "traceId": "..."
}
```

## RFC 7807

ASP.NET Core `ProblemDetails` is a good ecosystem default, but this API already has a frontend-oriented contract requirement with `success`, `code`, `errors` and `traceId`. The chosen `ApiErrorResponse` keeps a predictable product API shape while preserving the useful parts of Problem Details through status, message and trace correlation.

## Frontend Impact

Axios / React Query can normalize all failures from one object shape:

```ts
type ApiErrorResponse = {
  success: false;
  statusCode: number;
  code: string;
  message: string;
  errors?: { field: string; message: string }[] | unknown;
  traceId?: string;
};
```

Recommended usage:

- Toasts read `error.response.data.message`.
- Form errors read `error.response.data.errors` when `code === "validation_error"`.
- Auth flows branch on `code === "unauthorized"` or `code === "forbidden"`.
- Support/debug UI can display `traceId`.

## Migration Plan

1. Keep `ApiErrorResultFilter` enabled as a compatibility layer.
2. Replace controller-local error mapping with a shared `ServiceResult<T>` to `ActionResult` mapper.
3. Replace raw string and anonymous object errors during feature work.
4. Add tests for representative 400, 401, 403, 404, 429 and 500 responses.
5. Add a static scan/check that flags new `BadRequest("...")`, `BadRequest(new { message = ... })`, bodyless `NotFound()` and bodyless `Unauthorized()` usages.
