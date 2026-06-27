# Çoklu Deneme Başlatma ve Devam Etme

## API

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/quizzes/session/{attemptId}` | Mode-aware route, resume state, kalan süre |
| GET | `/api/quizzes/active` | Aktif oturum listesi (öğrenci) |

## Route eşlemesi

| QuizMode | Frontend route |
|----------|----------------|
| FreeTrial | `/quiz/free/:attemptId` |
| LicensedQuiz | `/quiz/licensed/:attemptId` |
| CoursePractice | `/quiz/course-practice/:attemptId` |
| WrongAnswers | `/quiz/wrong-answers/:attemptId` |
| ReviewSession | `/reviews/session/:attemptId` |
| MixedPractice | `/quiz/mixed/:attemptId` |
| TopicPractice | `/quiz/topic/:attemptId` |
| MockExam | `/quiz/mock/:attemptId` |

Eski `TrialExam` kayıtları: `IsFree` → FreeTrial, aksi halde LicensedQuiz.

## Timeout (varsayılan)

- FreeTrial: 2 saat
- LicensedQuiz: 3 saat
- MockExam: 4 saat
- Trial exam süreli ise `DurationMinutes` öncelikli

## Frontend

- `/quiz/session/:attemptId` — resolver redirect
- `useQuizSessionNavigate()` — Devam Et butonları
- `ResumeQuizModal` — çakışan oturum uyarısı
- `ActiveQuizSessionsPanel` — dashboard aktif oturumlar

## Migration

```bash
cd API
dotnet ef database update
```

Migration: `AddQuizSessionResumeFields` (`LastActivityAt`)
