# Gamification System

## Architecture

Backend folders:

- `API/Entities`
- `API/Dtos`
- `API/Repositories`
- `API/Services`
- `API/Mapping`
- `API/Validators`
- `API/Controllers`

Frontend folders:

- `Client/src/models/gamification.ts`
- `Client/src/services/gamificationApi.ts`
- `Client/src/stores/gamificationStore.ts`
- `Client/src/features/gamification`

## Main flow

1. Student opens `/api/gamification/profile`.
2. Profile is created lazily if missing.
3. Daily login XP is awarded once per day.
4. Daily goals are generated for the current day if missing.
5. Quiz/review completions enqueue gamification domain events.
6. Background event worker awards XP, updates streak, progresses goals, unlocks badges, and refreshes leaderboard data.

## Endpoints

### `GET /api/gamification/profile`

```json
{
  "id": "6c6f1d16-2d4e-4de9-9e54-01819ff20da7",
  "userId": "student-id",
  "level": 4,
  "xp": 82,
  "totalXp": 613,
  "currentLevelXpThreshold": 573,
  "nextLevelXpThreshold": 1073,
  "levelProgressPercentage": 8.2,
  "currentStreak": 5,
  "longestStreak": 9,
  "dailyGoalCompleted": false,
  "lastActivityAt": "2026-05-24T20:10:00Z",
  "rank": 7,
  "unlockedBadgeCount": 3,
  "totalBadgeCount": 5,
  "completedDailyGoalCount": 2
}
```

### `GET /api/gamification/badges`

```json
[
  {
    "badgeId": "9e4d4c4e-f888-4908-bb14-73aaaf1d8422",
    "name": "Ilk Adim",
    "description": "Ilk quiz tamamlandiginda acilir.",
    "iconUrl": "/icons/badges/first-step.svg",
    "xpReward": 20,
    "category": 3,
    "isHidden": false,
    "unlocked": true,
    "unlockedAt": "2026-05-24T11:00:00Z",
    "progress": 1,
    "requirementValue": 1
  }
]
```

### `GET /api/gamification/daily-goals`

```json
[
  {
    "userDailyGoalId": "f6f6b48d-7e65-4bc3-8fd0-eccf4841fcba",
    "dailyGoalId": "a1254aaf-c0a1-4028-9079-2d71251b0a05",
    "title": "20 soru coz",
    "description": "Bugun en az 20 soru coz.",
    "goalType": 1,
    "targetValue": 20,
    "progress": 12,
    "completed": false,
    "completedAt": null,
    "xpReward": 40,
    "activeDate": "2026-05-24"
  }
]
```

### `GET /api/gamification/leaderboard?period=2&metric=1&top=10`

### `GET /api/gamification/xp-history?page=1&pageSize=20`

## XP Rules

- Daily login: `10`
- Quiz completion: `25`
- `>= 90%` accuracy bonus: `50`
- Wrong answer review: `15`
- Daily goal completion: `40`
- Every 7-day streak milestone: `100`

## Anti-abuse rules

- Same quiz does not award base/accuracy XP repeatedly on the same day.
- Daily XP cap is controlled by `Gamification:DailyXpCap`.
- Badge duplicate is blocked by `UserId + BadgeId` unique index.
- Daily goal duplicate is blocked by `ActiveDate + GoalType + TargetValue` and `UserId + DailyGoalId` unique indexes.

## Level algorithm

Formula:

```text
Level XP = 100 * level^1.5
```

Implementation notes:

- `TotalXP` is cumulative lifetime XP.
- `XP` stores current level progress.
- `GamificationMath.ResolveLevelState` recalculates level thresholds from `TotalXP`.

## Leaderboard cache strategy

Current implementation uses `ILeaderboardCache` with `IMemoryCache`.

Production swap:

1. Replace `LeaderboardCache` with a Redis-backed implementation using `IDistributedCache` or StackExchange.Redis.
2. Keep cache keys in the format `leaderboard:{period}:{metric}:{top}`.
3. Use 2-5 minute TTL for daily/weekly/monthly boards.
4. Invalidate on XP award, streak milestone, and badge unlock if near-real-time freshness is required.

## Background jobs

Implemented:

- `GamificationEventQueue` as a hosted background worker.
- Async event dispatch for:
  - `QuizCompletedEvent`
  - `ReviewCompletedEvent`
  - `DailyGoalCompletedEvent`
  - `StreakUpdatedEvent`

Recommended next step:

- Move heavy badge recalculations and leaderboard invalidation to Hangfire or Quartz when traffic grows.

## SQL index recommendations

- `UserGamificationProfiles(UserId)` unique
- `UserGamificationProfiles(TotalXP, Level)`
- `XPTransactions(UserId, CreatedAt)`
- `XPTransactions(UserId, ReferenceType, ReferenceId)`
- `UserBadges(UserId, BadgeId)` unique
- `UserDailyGoals(UserId, DailyGoalId)` unique
- `DailyGoals(ActiveDate, GoalType, TargetValue)` unique

## Performance notes

- XP history is paged.
- Leaderboard is cached.
- Badge unlock runs asynchronously through the background queue.
- Daily goals are generated lazily and only once per day.

## Best practices

- Keep XP awarding idempotent with reference keys.
- Treat badge checks as eventually consistent, not request-blocking.
- Prefer cumulative counters in the profile table for read-heavy dashboards.
- Use UTC in storage and convert to local time only for presentation logic.
- Add integration tests for event handlers before introducing more badge types.
