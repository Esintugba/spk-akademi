# Yanlışlarım Test Modu

## Endpointler

| Method | Path | Açıklama |
|--------|------|----------|
| POST | `/api/quizzes/wrong-answers/start` | Tekrar testi oluştur |
| GET | `/api/quizzes/wrong-answers/queue` | Kuyruk (pagination) |
| DELETE | `/api/quizzes/wrong-answers/{questionId}` | Kuyruktan çıkar |
| GET | `/api/quizzes/wrong-answers/stats` | Özet istatistikler |

## Spaced Repetition

| Tekrar | Aralık |
|--------|--------|
| 1 | 1 gün |
| 2 | 3 gün |
| 3 | 7 gün |
| 4+ | 14 gün |

4 doğru tekrar sonrası `IsMastered = true`.

## SQL Index Önerileri

```sql
CREATE INDEX IX_WrongAnswerQueues_Student_Due
  ON WrongAnswerQueues (StudentId, NextReviewAt, IsMastered);

CREATE UNIQUE INDEX IX_WrongAnswerQueues_Student_Question
  ON WrongAnswerQueues (StudentId, QuestionId);

CREATE INDEX IX_WrongAnswerReviewHistories_Student_ReviewedAt
  ON WrongAnswerReviewHistories (StudentId, ReviewedAt);
```

## Migration

```bash
cd API
dotnet ef database update
```

## Frontend

`/quiz/wrong-answers` — özet, kuyruk, filtre, test başlatma.
