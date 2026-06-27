# Müfredat Mimarisi Refactor

## Amaç

Mevcut `Ders -> Üst Konu -> Alt Konu` dili teknik kategori ağacı gibi algılanıyor. SPK öğrencisinin zihinsel modeli ise sınav müfredatı üzerinden ilerliyor:

```text
Lisans
  -> Ders
    -> Ana Konu
      -> Alt Konu
```

Bu refactor, teknik `Topic` modelini korurken ürün dilini ve iş kurallarını SPK müfredatına yaklaştırır. `ParentTopicId` veritabanında kalır, fakat kullanıcıya gösterilen dilde "üst konu" kullanılmaz.

## Kavramsal Model

### Lisans

Sınavın tamamını temsil eder.

Örnekler:

- Düzey 1
- Düzey 2
- Düzey 3
- Gayrimenkul Değerleme
- Kredi Derecelendirme

### Ders

Kitap veya modül düzeyidir. Öğrencinin sorusu: "Hangi dersi çalışıyorum?"

Örnekler:

- Sermaye Piyasası Mevzuatı
- Sermaye Piyasası Araçları
- Muhasebe
- Finansal Yönetim

### Ana Konu

Ders içindeki büyük müfredat başlığıdır. Öğrencinin sorusu: "Bu dersin hangi bölümündeyim?"

Örnekler:

- Halka Açık Ortaklıklar
- Portföy Yönetimi
- Muhasebe Standartları
- Yatırım Kuruluşları

### Alt Konu

Soru üretilebilecek en küçük ölçülebilir öğrenme birimidir. Öğrencinin sorusu: "Bugün tam olarak ne öğreniyorum?"

Örnekler:

- Pay alım teklifi
- Özel durum açıklamaları
- Kar payı dağıtımı
- Kurumsal yönetim

## Hedef Hiyerarşi

```text
Düzey 1
  Sermaye Piyasası Araçları
    Ana Konu: Paylar
      Alt Konu: Payların hukuki niteliği
      Alt Konu: Pay sahipliği hakları
      Alt Konu: Halka arz süreci
    Ana Konu: Borçlanma Araçları
      Alt Konu: Tahvil
      Alt Konu: Bono
      Alt Konu: Kira sertifikası
      Alt Konu: İhraç limitleri
```

## Veri Modeli

Teknik entity korunur:

```csharp
public class Topic : BaseEntity
{
    public Guid CourseId { get; set; }
    public Guid? ParentTopicId { get; set; }
    public TopicType Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public int Order { get; set; }
    public string? Summary { get; set; }
    public string? ImportantPoints { get; set; }
    public string? CommonMistakes { get; set; }
    public string? Formulas { get; set; }
    public string? ExamNotes { get; set; }
    public string? CriticalThresholds { get; set; }
}

public enum TopicType
{
    MainTopic = 1,
    SubTopic = 2
}
```

Mevcut alan eşleşmesi:

| Mevcut alan | Yeni ürün anlamı |
| --- | --- |
| `ParentTopicId == null` | Ana konu |
| `ParentTopicId != null` | Alt konu |
| `Summary` | Ana konu özeti veya alt konu tanımı |
| `ImportantPoints` | Önemli noktalar veya soru çözüm ipuçları |
| `CommonMistakes` | Sık yapılan hatalar veya karıştırılan kavramlar |
| `Formulas` | Formüller, süreler, oranlar |

Yeni `Type` alanı, `ParentTopicId` üzerinden türetilebilen bilgiyi açık domain sözleşmesine çevirir. `ParentTopicId` teknik ilişki alanı olarak kalır; UI ve rapor dilinde görünmez.

## Entity Refactor Planı

1. `TopicType` enum eklenir.
2. `Topic.Type` alanı eklenir ve EF tarafında `HasConversion<int>()` ile saklanır.
3. Validasyon kuralları sıkılaştırılır:
   - `MainTopic` için `ParentTopicId` boş olmalıdır.
   - `SubTopic` için `ParentTopicId` dolu olmalıdır.
   - Alt konu yalnızca aynı dersteki bir ana konuya bağlanabilir.
   - Üçüncü seviye konu oluşturulamaz.
4. DTO'lara `Type`, `MainTopicId`, `MainTopicTitle`, `SubTopicCount`, `QuestionCount` alanları eklenir.
5. Geriye uyumluluk için ilk geçişte mevcut `parentTopicId` alanı API'de kalabilir; yeni UI bu alanı teknik veri olarak kullanır, etiketlemez.
6. `TopicRepository.SortTopics` iki seviye garantisi verecek şekilde sadeleştirilir.

Önerilen DTO dili:

```csharp
public record TopicDto(
    Guid Id,
    Guid CourseId,
    TopicType Type,
    Guid? MainTopicId,
    string? MainTopicTitle,
    string Title,
    string Slug,
    int Order,
    string? Summary,
    string? ImportantPoints,
    string? CommonMistakes,
    string? Formulas,
    string? ExamNotes,
    string? CriticalThresholds,
    int SubTopicCount,
    int QuestionCount);
```

## İçerik Modeli

### Ana Konu Alanları

Ana konu, alt konular arasında ortak çerçeve kurar.

- Başlık
- Ana konu özeti
- Önemli noktalar
- Sık yapılan hatalar
- Formüller
- Süreler
- Oranlar

Admin alan eşleşmesi:

- `Summary`: Ana konu özeti
- `ImportantPoints`: Önemli noktalar
- `CommonMistakes`: Sık yapılan hatalar
- `Formulas`: Formüller / süreler / oranlar
- `CriticalThresholds`: Kritik eşikler
- `ExamNotes`: Sınav notları

### Alt Konu Alanları

Alt konu, doğrudan soru çözümüne hazırlar.

- Tanım
- İstisnalar
- Süreler
- Kurul kararları
- Soru çözüm ipuçları
- Karıştırılan kavramlar

Admin alan eşleşmesi:

- `Summary`: Tanım
- `ImportantPoints`: Soru çözüm ipuçları
- `CommonMistakes`: Karıştırılan kavramlar
- `Formulas`: Süreler / oranlar / hesaplamalar
- `CriticalThresholds`: Kritik eşikler
- `ExamNotes`: Kurul kararları ve sınav notları

## UI Terminoloji Dönüşümü

| Eski | Yeni |
| --- | --- |
| Üst konu | Ana konu |
| Üst konu yok | Ana konu seç |
| Konu başlığı | Başlık |
| Konu listesi | Müfredat |
| Konu detayı | Müfredat detayı |
| Konu Bazlı Test | Alt konu testi veya Müfredat testi |
| Zayıf konular | Riskli alt konular |
| Konu başarısı | Ana konu başarısı / Alt konu başarısı |

Teknik terimler sadece geliştirici kodunda kalır:

- `ParentTopicId`
- `Topic`
- `TopicId`

Ürün yüzeyinde kullanılacak terimler:

- Lisans
- Ders
- Ana konu
- Alt konu
- Soru sayısı
- Çalış
- Test çöz
- Tekrar et

## Admin Ekranları

Admin konu yönetimi tek formda devam edebilir, fakat kullanıcı akışı şu hale getirilmelidir:

1. Ders seçilir.
2. Tür seçilir: `Ana Konu` veya `Alt Konu`.
3. Tür `Alt Konu` ise `Ana konu seç` alanı zorunlu olur.
4. Tür `Ana Konu` ise `Ana konu seç` alanı gösterilmez veya pasif olur.
5. İçerik alan etiketleri türe göre değişir.

Ana konu formu:

- Ders
- Tür: Ana konu
- Başlık
- Sıra
- Kısa kod
- Ana konu özeti
- Önemli noktalar
- Sık yapılan hatalar
- Formüller / süreler / oranlar
- Kritik eşikler
- Sınav notları

Alt konu formu:

- Ders
- Tür: Alt konu
- Ana konu seç
- Başlık
- Sıra
- Kısa kod
- Tanım
- Soru çözüm ipuçları
- Karıştırılan kavramlar
- Süreler / oranlar / hesaplamalar
- Kritik eşikler
- Kurul kararları ve sınav notları

Liste görünümü:

```text
Ders: Sermaye Piyasası Araçları

Ana Konu: Paylar
  12 alt konu
  86 soru

  Alt Konu: Payların hukuki niteliği
    18 soru
    Çalış | Test çöz
```

Silme kuralları:

- Alt konusu olan ana konu silinemez.
- Sorusu, çalışma notu veya ilerleme kaydı olan alt konu silinmeden önce taşıma akışı önerilir.
- Ana konu değişimi, alt konuların `CourseId` tutarlılığını bozmaz.

## Öğrenci Ekranları

Öğrenci tarafında ana akış:

```text
Ders
  -> Ana Konu
    -> Alt Konu
      -> PDF
      -> Quiz
      -> Tekrar
```

Ders detay ekranı:

- Ana konu kartları
- Her ana konu altında alt konu listesi
- Ana konu başarı özeti
- Alt konu soru sayısı
- Alt konu aksiyonları: `Çalış`, `Test Çöz`

Alt konu satırı:

```text
Alt Konu: Özel Durum Açıklamaları
Soru Sayısı: 20
Durum: Tekrar gerekiyor
Çalış | Test Çöz
```

Dashboard bugünkü öneri:

```text
Bugün

Muhasebe
Ana Konu: Finansal Tablolar
Alt Konu: Nakit Akış Tablosu

25 dk çalışma
20 soru çöz
```

## Veri Migrasyonu

Migration adımları:

1. `Topics` tablosuna `Type` kolonu eklenir.
2. Mevcut kayıtlar dönüştürülür:
   - `ParentTopicId IS NULL` olanlar `MainTopic`
   - `ParentTopicId IS NOT NULL` olanlar `SubTopic`
3. Çok seviyeli veri varsa raporlanır:
   - `SubTopic` parent'ı da bir alt konuysa kayıt `curriculum_hierarchy_violations` raporuna alınır.
   - Otomatik düzeltme yapılmadan önce admin onayı gerekir.
4. `ExamNotes` ve `CriticalThresholds` nullable kolonları eklenir.
5. Index önerileri eklenir.

Önerilen SQL kontrolü:

```sql
SELECT child.Id, child.Title, parent.Id AS ParentId, parent.Title AS ParentTitle
FROM Topics child
JOIN Topics parent ON child.ParentTopicId = parent.Id
WHERE parent.ParentTopicId IS NOT NULL;
```

Önerilen indexler:

```sql
CREATE INDEX IX_Topics_CourseId_Type_Order
ON Topics (CourseId, Type, "Order");

CREATE INDEX IX_Topics_ParentTopicId_Type_Order
ON Topics (ParentTopicId, Type, "Order");
```

## Quiz Entegrasyonu

Quiz üretimi alt konu bazında çalışmalıdır.

Kurallar:

- `Question.TopicId` tercihen `SubTopic` kaydına bağlanır.
- Ana konu seçilerek quiz başlatılırsa sistem ana konunun alt konularındaki sorulardan havuz üretir.
- Alt konu seçilerek quiz başlatılırsa yalnızca o alt konunun soruları kullanılır.
- Ana konuya doğrudan soru bağlama geçiş döneminde desteklenebilir, fakat yeni içerik girişinde engellenmelidir.

Quiz filtreleri:

- `licenseId`
- `courseId`
- `mainTopicId`
- `subTopicId`
- `difficulty`
- `questionCount`

Önerilen endpoint davranışı:

```text
POST /api/quizzes/start

mainTopicId varsa:
  topicIds = mainTopic.SubTopics.Select(Id)

subTopicId varsa:
  topicIds = [subTopicId]
```

Quiz sonuçlarında gösterim:

- Ders
- Ana konu
- Alt konu
- Doğru / yanlış
- Başarı oranı
- Tekrar önerisi

## Review Entegrasyonu

Tekrar sistemi soru bazlı kalır, fakat raporlaması alt konu ve ana konuya toplanır.

Kuyruk üretimi:

- `QuestionStudyProgress.Question.TopicId` alt konu kabul edilir.
- Vadesi gelen sorular alt konuya göre gruplanır.
- Ana konu, alt konunun parent'ından türetilir.

Review ekranı:

```text
Tekrar Gereken Alt Konular

Ana Konu: Halka Açık Ortaklıklar
Alt Konu: Özel Durum Açıklamaları
Vadesi gelen soru: 8
```

Raporlar:

- Tekrar gereken alt konular
- Zayıf ana konular
- Alt konu mastery dağılımı
- Gecikmiş tekrar sayısı

## Adaptif Plan Entegrasyonu

Plan motoru görevleri alt konu bazında üretmelidir.

Mevcut `AdaptiveStudyTask.TopicId` korunur, fakat anlamı `SubTopicId` olarak kabul edilir. DTO'da öğrenci dilini güçlendirmek için şu alanlar eklenmelidir:

- `MainTopicId`
- `MainTopicTitle`
- `SubTopicId`
- `SubTopicTitle`
- `CourseName`

Örnek görev:

```text
25 dk
Özel Durum Açıklamaları
20 soru çöz

Ders: Sermaye Piyasası Mevzuatı
Ana Konu: Halka Açık Ortaklıklar
Alt Konu: Özel Durum Açıklamaları
```

Öncelik skoru:

```text
Priority =
ExamUrgency
+ SubTopicWeakness
+ ReviewUrgency
+ ProgressGap
+ MainTopicCoverageGap
+ TimeAvailability
```

Üretim kuralları:

- Öncelik her zaman alt konu için hesaplanır.
- Ana konu sadece gruplama, kapsam boşluğu ve gösterim için kullanılır.
- Ana konu altında hiç alt konu yoksa plan görevi üretilmez; admin içerik uyarısı oluşturulur.
- `/study/:topicId` linki alt konuya gider.
- Ana konu linki ders içindeki bölümü açar.

## Analitik Modeli

Analitik iki seviyede raporlanır.

Ana konu başarısı:

```text
MainTopicSuccess =
  alt konuların ağırlıklı başarı ortalaması

Ağırlık =
  max(questionCount, attemptedQuestionCount, 1)
```

Alt konu başarısı:

```text
SubTopicSuccess =
  correctAnswers / answeredQuestions
```

Riskli alt konu skoru:

```text
Risk =
  WrongRate * 0.40
+ DueReviewRate * 0.25
+ LowMasteryRate * 0.20
+ NotStudiedPenalty * 0.15
```

Rapor başlıkları:

- Ana konu başarısı
- Alt konu başarısı
- Riskli alt konular
- Tekrar gereken alt konular
- Soru yoğunluğu düşük alt konular
- Müfredat kapsam boşlukları

Analytics DTO önerileri:

```csharp
public record MainTopicAnalyticsDto(
    Guid MainTopicId,
    string MainTopicTitle,
    string CourseName,
    int SubTopicCount,
    int QuestionCount,
    decimal SuccessRate,
    int DueReviewCount,
    IReadOnlyList<SubTopicAnalyticsDto> SubTopics);

public record SubTopicAnalyticsDto(
    Guid SubTopicId,
    string SubTopicTitle,
    Guid MainTopicId,
    string MainTopicTitle,
    string CourseName,
    int QuestionCount,
    int AnsweredQuestionCount,
    decimal SuccessRate,
    int WrongCount,
    int DueReviewCount,
    decimal RiskScore);
```

## API Sözleşmesi

Önerilen yeni okuma endpointleri:

```text
GET /api/curriculum/licenses/{licenseId}
GET /api/curriculum/courses/{courseId}
GET /api/curriculum/main-topics/{mainTopicId}
GET /api/curriculum/sub-topics/{subTopicId}
GET /api/curriculum/analytics
```

Mevcut `/api/topics` endpointi admin ve geriye uyumluluk için korunabilir. Yeni öğrenci yüzeyleri `curriculum` endpointlerini kullanmalıdır.

Önerilen projection:

```text
LicenseCurriculumDto
  CourseCurriculumDto[]
    MainTopicCurriculumDto[]
      SubTopicCurriculumDto[]
```

## Uygulama Dilimleri

### Dilim 1: Terminoloji

- Admin `Üst konu` etiketlerini `Ana konu` yap.
- `Üst konu yok` yerine `Ana konu seç` kullan.
- Öğrenci ekranlarında `Alt konu`, `Ana konu`, `Soru sayısı`, `Çalış`, `Test çöz` dilini yerleştir.

### Dilim 2: Domain Tipi

- `TopicType` enum ve migration ekle.
- Validasyonları iki seviyeye sabitle.
- DTO ve TypeScript modellerini güncelle.

### Dilim 3: Müfredat Projection

- Lisans -> ders -> ana konu -> alt konu projection endpointleri ekle.
- Dashboard ve ders ekranlarını bu projection ile besle.

### Dilim 4: Quiz ve Review

- Quiz filtrelerine `mainTopicId` ve `subTopicId` ekle.
- Review istatistiklerini ana konu / alt konu kırılımına taşı.

### Dilim 5: Plan ve Analitik

- Adaptif plan görevlerini alt konu bazlı üret.
- Ana konu ve alt konu başarı raporlarını ekle.
- Riskli ve tekrar gereken alt konu listelerini dashboard'a bağla.

## Kabul Kriterleri

- Öğrenci UI'ında "Üst konu" ifadesi görünmez.
- Admin formunda alt konu oluştururken alan adı `Ana konu seç` olur.
- `Topic.Type` veritabanında tutulur.
- Ana konu üçüncü seviye parent alamaz.
- Alt konu aynı ders içindeki bir ana konuya bağlı olmak zorundadır.
- Yeni sorular varsayılan olarak alt konuya bağlanır.
- Quiz ana konu seçildiğinde alt konulardan soru havuzu üretir.
- Review ve yanlış cevap raporları alt konu bazında listelenir.
- Dashboard bugünkü görevde ders, ana konu ve alt konu bilgisini gösterir.
- Analitiklerde `Ana Konu Başarısı`, `Alt Konu Başarısı`, `Riskli Alt Konular`, `Tekrar Gereken Alt Konular` bulunur.
