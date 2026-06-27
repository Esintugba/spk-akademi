# State Ownership Audit

## Summary

Server state ownership has been consolidated around TanStack Query.

Resolved issues:

- `appDataSlice` was removed from Redux.
- Gamification query results are no longer hydrated into Zustand.
- `quizSessionStore.currentSession` and `quizSessionStore.activeSessions` were removed.
- Quiz session resolution now writes the fetched session to TanStack Query cache.

## Current Ownership

| State | Owner |
| --- | --- |
| Auth user/session | Redux Toolkit `authSlice` |
| API/server data | TanStack Query |
| Gamification profile, badges, goals, XP history | TanStack Query |
| Quiz session and active sessions | TanStack Query |
| Resume quiz prompt | Zustand `quizSessionStore` |
| Gamification celebration notices | Zustand `gamificationStore` |
| Feature filters, local prompts, wizard state | Zustand or component state |

## Removed Dual Sources

### Gamification

Previous:

```text
React Query -> hydrate() -> Zustand -> UI
```

Current:

```text
React Query -> UI
Zustand -> celebration notices only
```

### Quiz Sessions

Previous:

```text
API -> Zustand currentSession / activeSessions
```

Current:

```text
API -> TanStack Query cache
Zustand -> resume prompt only
```

### App Data

Previous:

```text
API -> Redux appDataSlice -> route context
```

Current:

```text
Page route -> TanStack Query -> UI
```

## Guardrails

- Do not add server DTOs to Redux or Zustand.
- Do not hydrate query results into client stores.
- Use `queryClient.setQueryData` only for TanStack Query cache updates.
- Use Zustand for UI behavior, not backend data ownership.
- Use Redux only for auth/session identity.

## Verification

Checks performed:

- No `hydrate()` call remains in `Client/src`.
- No `currentSession`, `activeSessions`, `setCurrentSession`, or
  `setActiveSessions` remains in `Client/src`.
- No API/request/query call remains inside `Client/src/stores`.
- `npm run build` passes.
- `npm run lint` passes.
