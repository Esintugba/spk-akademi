# Ders Bazlı Practice (CoursePractice)

## Endpointler

| Method | Path | Açıklama |
|--------|------|----------|
| GET | `/api/quizzes/course-practice/courses` | Erişilebilir dersler + istatistik |
| POST | `/api/quizzes/course-practice/start` | Practice testi oluştur |

## Akış

`Ders Seç → Filtreler → POST start → Çöz → /quiz/results/{attemptId}`

## Migration

```bash
cd API && dotnet ef database update
```

## Frontend

`/quiz/course-practice` — React Hook Form + Zod
