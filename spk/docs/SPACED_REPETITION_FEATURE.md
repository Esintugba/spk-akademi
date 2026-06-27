# Akıllı Tekrar Sistemi (SM-2 Spaced Repetition)

## Özet

Soru bazlı SM-2 benzeri spaced repetition algoritması ile günlük tekrar kuyruğu, tekrar oturumu ve öğrenme analitiği.

Konu bazlı `StudyProgress` (ders paneli) korunur; soru bazlı takip için `QuestionStudyProgress` kullanılır.

## API

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/reviews/today` | Vadesi gelen sorular + özet |
| POST | `/api/reviews/start` | Tekrar oturumu başlat |
| POST | `/api/reviews/submit` | Kalite puanları ile SM-2 güncelle |
| GET | `/api/reviews/stats` | Trend, ustalık, zayıf konular |

Yetki: `StudentOnly`

## SM-2 Kuralları

- **Quality 0–5**: Kullanıcı öz-değerlendirmesi
- **quality < 3**: `Repetition = 0`, `IntervalDays = 1`
- **quality ≥ 3**: repetition++, EF güncelleme, interval tablosu (1, 3, 7, 14, 30, sonra EF×interval)
- **EF**: `EF' = EF + (0.1 - (5-q)*(0.08 + (5-q)*0.02))`, min 1.3
- **Mastery**: &lt;3 Başlangıç, 3–5 Orta, 6–10 İleri, 10+ Uzman

## Entity'ler

- `QuestionStudyProgress` — soru/öğrenci SM-2 durumu
- `ReviewSession` — oturum (2 saat timeout)
- `ReviewSessionAnswer` — oturum cevapları (duplicate engelli unique index)

## SQL Index Önerileri

```sql
-- QuestionStudyProgress
CREATE INDEX IX_QSP_Student_NextReview ON QuestionStudyProgresses (StudentId, NextReviewAt, MasteryLevel);
CREATE UNIQUE INDEX IX_QSP_Student_Question ON QuestionStudyProgresses (StudentId, QuestionId);

-- ReviewSession
CREATE INDEX IX_RS_Student_Completed ON ReviewSessions (StudentId, CompletedAt);

-- ReviewSessionAnswer
CREATE UNIQUE INDEX IX_RSA_Session_Question ON ReviewSessionAnswers (ReviewSessionId, QuestionId);
```

## Frontend

- `/reviews/today` — özet, kuyruk, grafikler (Recharts)
- `/reviews/session/:sessionId` — kalite butonları ile tekrar

## Quiz Entegrasyonu

`QuizzesController.SubmitQuiz` sonrası `SyncFromQuizAnswersAsync` ile her cevap SM-2'ye işlenir (doğru=4, yanlış=1 kalite).

## Migration

```bash
cd API
dotnet ef database update
```

Migration adı: `AddSpacedRepetitionReviewSystem`

## Klasör Yapısı

```
API/
  Controllers/ReviewsController.cs
  Services/Sm2AlgorithmService.cs
  Services/ReviewSessionService.cs
  Repositories/QuestionStudyProgressRepository.cs
  Repositories/ReviewSessionRepository.cs
  Entities/QuestionStudyProgress.cs
  Entities/ReviewSession*.cs
Client/src/features/reviews/
```

## Yanlış Cevap Servisi

`ISpacedRepetitionService` (basit 1/3/7/14 gün) yanlış cevap kuyruğu içindir; SM-2 için `ISm2AlgorithmService` kullanılır.
