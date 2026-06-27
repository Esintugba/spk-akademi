# Lisanslı Deneme Başlatma — Mimari Özet

## Klasör Yapısı

```
API/
  Authorization/AuthorizationPolicies.cs
  Controllers/QuizzesController.cs          # POST /api/quizzes/trial/start
  Controllers/StudentController.cs          # GET  /api/student/my-trials
  Dtos/TrialQuizDtos.cs
  Entities/QuizAttempt.cs, TrialExamPurchase.cs, QuizAttemptStatus.cs
  Extensions/ApplicationServiceExtensions.cs
  Mapping/QuizTrialMappingProfile.cs
  Repositories/QuizAttemptRepository.cs, StudentLicenseRepository.cs, TrialExamRepository.cs
  Services/QuizTrialService.cs
  Validators/StartLicensedQuizRequestValidator.cs

Client/src/
  app/queryClient.ts
  features/my-trials/MyTrialsPage.tsx
  features/my-trials/TrialExamSessionPage.tsx
  features/my-trials/components/TrialCard.tsx
  stores/quizTrialStore.ts
  models/trialQuiz.ts
  services/trialQuizApi.ts
```

## Örnek İstek / Yanıt

**POST** `/api/quizzes/trial/start`

```json
{ "quizId": "3fa85f64-5717-4562-b3fc-2c963f66afa6" }
```

**200 OK**

```json
{
  "attemptId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "quizId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "startedAt": "2026-05-20T12:00:00Z",
  "remainingTime": 5400,
  "status": 1
}
```

**403 Forbidden** — erişim yok (ücretsiz değil, lisans yok, satın alma yok).

## İş Kuralları

1. JWT + rol `Student` zorunlu (`AuthorizationPolicies.StudentOnly`).
2. Deneme: yayında, onaylı, soft-delete değil.
3. Erişim: `IsFree` **veya** aktif `UserLicenseAccess` **veya** aktif `TrialExamPurchase`.
4. Devam eden süresi dolmamış attempt varsa resume; süresi dolmuşsa `Expired` işaretlenip yeni attempt açılır.

## Best Practices

- Repository katmanı yalnızca veri erişimi; iş kuralları `QuizTrialService` içinde.
- FluentValidation ile giriş doğrulama; AutoMapper ile entity→DTO.
- `CancellationToken` tüm async zincirde iletilir.
- Frontend: TanStack Query (server state + retry), Zustand (oturum/cevap cache).
