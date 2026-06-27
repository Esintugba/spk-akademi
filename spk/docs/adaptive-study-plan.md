# Adaptive Study Planning Engine

## Amac

Hedefler, ilerleme, tekrar ve quiz performansini tek karar motorunda birlestirerek ogrenciye her gun uygulanabilir calisma plani uretmek.

## Veri Akisi

```text
UserSettings
  ExamDate, DailyStudyMinutes, WeeklyStudyMinutes, PreferredStudyDays, DefaultQuizMode
        |
StudyProgress + TopicProgress + CourseProgress
        |
Review queue + NextReviewAt
        |
WrongAnswers + QuizAnswers + QuizAttempt
        |
AdaptiveStudyPlanService
        |
AdaptiveStudyPlan + AdaptiveStudyTask
        |
GET /api/study-plan/today
GET /api/study-plan/week
POST /api/study-plan/regenerate
GET /api/study-plan/recommendations
        |
Student Dashboard: Bugunun Plani
```

## Servis Tasarimi

`AdaptiveStudyPlanService` sorumluluklari:

- `LoadUserContext`: kullanici ayarlari, aktif lisans konulari, progress, review, wrong answer ve quiz performans verilerini yukler.
- `CalculatePriority`: konu bazli oncelik skorunu hesaplar.
- `BuildDailyPlan`: gunluk kapasiteye gore tekrar, konu, quiz ve yanlis analizi gorevlerini olusturur.
- `GenerateRecommendations`: riskli konu, tekrar ve yanlis analizi onerileri uretir.
- `EstimateTargetCompletion`: sinav tarihine ve haftalik kapasiteye gore tahmini tamamlama oranini hesaplar.

## Skorlama Modeli

```text
Priority Score =
ExamUrgency
+ WeakTopicScore
+ ReviewUrgency
+ ProgressGap
+ TimeAvailability
```

Skor bilesenleri:

- `ExamUrgency`: sinav tarihi yaklastikca artar.
- `WeakTopicScore`: dusuk basari orani ve yanlis sayisina gore artar.
- `ReviewUrgency`: bugun vadesi gelen ve gecikmis tekrar sayisina gore artar.
- `ProgressGap`: calisilmamis veya tamamlanmamis konulara ek agirlik verir.
- `TimeAvailability`: gunluk calisma kapasitesini plan agirligina dahil eder.

## Entity Tasarimi

`AdaptiveStudyPlan`

- `UserId`
- `PlanDate`
- `EstimatedMinutes`
- `CompletionRate`
- `GeneratedAt`
- `DaysUntilExam`
- `EstimatedTargetCompletionRate`
- `Summary`

`AdaptiveStudyTask`

- `PlanId`
- `Type`
- `TopicId`
- `TargetMinutes`
- `TargetQuestions`
- `Priority`
- `ActionUrl`
- `Title`
- `Description`

## Action Link Mimarisi

Plan gorevleri frontend tarafinda dogrudan calistirilabilir link olarak render edilir.

```text
Review              -> /reviews/today
TopicStudy          -> /study/:topicId
Quiz                -> /quiz, /quiz/course-practice, /quizzes
WrongAnswerAnalysis -> /quiz/wrong-answers
```

## Dashboard Entegrasyonu

Ogrenci dashboard'u `GET /api/study-plan/today` endpointinden veri alir ve su bilgileri gosterir:

- bugunku tekrar, konu, soru ve sure ozeti
- sinava kalan gun
- tahmini hedef tamamlama orani
- riskli konular
- bu haftanin kritik gorevleri
- calistirilabilir plan maddeleri

## Ogrenci Deneyimi

1. Ogrenci ayarlardan sinav tarihi, gunluk/haftalik kapasite ve calisma gunlerini girer.
2. Dashboard acildiginda bugunun plani otomatik uretilir veya mevcut plan okunur.
3. Ogrenci plan maddesinden ilgili calisma akisini baslatir.
4. Mevcut progress, review, quiz ve wrong answer akislarindaki tamamlanmalar yeni plan yenilemelerine yansir.
5. Plan tekrar olusturuldugunda risk sirasi ve gunluk gorevler guncellenir.

## Olcum Metrikleri

- Plan goruntulenme sayisi
- Plan gorevi baslatma orani
- Gunluk plan tahmini sureye uyum
- Review gecikme sayisi
- Riskli konu basari orani degisimi
- Yanlis cevap kuyrugu azalma hizi
- Sinav tarihine gore tahmini tamamlama orani

## Sonraki Otomasyon Adimlari

- Plan task completion event modeli eklendi.
- Plan task tamamlandiginda Goals, Analytics ve XP tarafina event publish edilir.
- Bildirim kanallari icin `Bugunku plan hazir`, `Plan guncellendi`, `Programdan geri kaldin`, `Tekrar zamani geldi` eventleri schedule edilebilir.
- Haftalik plan icin takvim gorunumu ve workload balancing eklenebilir.
