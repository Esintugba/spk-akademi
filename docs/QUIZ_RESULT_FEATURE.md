# Açıklamalı Quiz Sonuç Sistemi

## Endpoint

`GET /api/quizzes/results/{attemptId}?page=1&pageSize=20&includeExplanations=true`

## Klasör Yapısı

```
API/
  Dtos/QuizResultDetailDtos.cs
  Repositories/QuizResultRepository.cs
  Services/QuizResultService.cs
  Controllers/QuizzesController.cs  (GET results/{attemptId})

Client/src/
  features/quiz-results/QuizResultDetailPage.tsx
  features/quiz-results/components/QuestionSolutionCard.tsx
  models/quizResult.ts
  services/quizResultApi.ts
  stores/quizResultStore.ts
```

## Migration

```bash
cd API && dotnet ef database update
```
