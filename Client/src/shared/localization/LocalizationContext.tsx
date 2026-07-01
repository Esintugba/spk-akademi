/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  UserDateFormatPreference,
  UserLanguagePreference,
  UserTimeFormatPreference,
  type UserSettings,
} from '../../models'

type LocalizationContextValue = {
  language: UserLanguagePreference
  locale: 'tr-TR' | 'en-US'
  setLanguage: (language: UserLanguagePreference) => void
  t: (text: string) => string
  formatDate: (value?: string | Date | null) => string
  formatDateTime: (value?: string | Date | null) => string
  formatTime: (value?: string | Date | null) => string
}

const publicLanguageStorageKey = 'spk-akademi-public-language'

const english: Record<string, string> = {
  'Açık Tema': 'Light theme',
  'Koyu Tema': 'Dark theme',
  'Sistem Teması': 'System theme',
  Türkçe: 'Turkish',
  '24 saat': '24-hour',
  '12 saat': '12-hour',
  'Karışık Test': 'Mixed quiz',
  'Alt Konu Testi': 'Topic quiz',
  'Ders Bazlı Test': 'Course quiz',
  Yanlışlarım: 'Wrong answers',
  Deneme: 'Mock exam',
  Manuel: 'Manual',
  'Cevaptan sonra otomatik': 'Automatically after answering',
  'Doğru cevaptan sonra otomatik': 'Automatically after a correct answer',
  Metin: 'Text',
  'Bölünmüş görünüm': 'Split view',
  Dashboard: 'Dashboard',
  'Çalışma Merkezi': 'Study Center',
  Derslerim: 'My Courses',
  Konularım: 'My Topics',
  Kaynaklarım: 'My Resources',
  Notlarım: 'My Notes',
  'Test Merkezi': 'Quiz Center',
  'Deneme Kataloğu': 'Quiz Catalog',
  Denemelerim: 'My Quizzes',
  'Çıkmış Sorular': 'Past Exam Questions',
  'Tekrar Merkezi': 'Review Center',
  'Bugünkü Tekrarlar': "Today's Reviews",
  Performans: 'Performance',
  Sonuçlarım: 'My Results',
  Analitikler: 'Analytics',
  Hedeflerim: 'My Goals',
  'Başarı ve Oyunlaştırma': 'Achievements & Gamification',
  Rozetler: 'Badges',
  Başarımlar: 'Achievements',
  'Liderlik Tablosu': 'Leaderboard',
  Hesap: 'Account',
  Profil: 'Profile',
  Erişimlerim: 'My Access',
  'Destek Taleplerim': 'My Support Tickets',
  Ayarlar: 'Settings',
  'Öğrenci çalışma merkezi': 'Student study center',
  'Öğrenci Paneli': 'Student Panel',
  'Ders, test ve tekrar merkezi': 'Courses, quizzes and review center',
  'Öğrenci hesabı': 'Student account',
  'Menüyü genişlet': 'Expand menu',
  'Menüyü daralt': 'Collapse menu',
  'Menüyü aç': 'Open menu',
  'Deneme Keşfet': 'Discover Quizzes',
  'Hoş geldin': 'Welcome',
  Çıkış: 'Sign out',
  Yakında: 'Soon',
  yakında: 'soon',
  'Çıkış yapıldı.': 'Signed out.',
  'Bugünkü çalışma, test ve tekrar akışına buradan devam edebilirsin.':
    "Continue today's study, quiz and review flow here.",
  'Platform deneyimini kendine göre ayarla.': 'Customize the platform experience.',
  'Bildirimler, çalışma hedefleri, quiz davranışı, PDF okuyucu, görünüm, dil ve güvenlik tercihleri tek merkezde.':
    'Manage notifications, study goals, quiz behavior, PDF reader, appearance, language and security in one place.',
  'Ayarları Kaydet': 'Save Settings',
  'Ayarlar kaydedildi.': 'Settings saved.',
  'Ayarlar kaydedilemedi.': 'Settings could not be saved.',
  'Ayarlar yüklenemedi.': 'Settings could not be loaded.',
  'Aktif profil': 'Active profile',
  Öğrenci: 'Student',
  'Kompakt görünüm': 'Compact view',
  'Standart görünüm': 'Standard view',
  'E-posta': 'Email',
  'Görünen ad': 'Display name',
  'Hesabı Güncelle': 'Update Account',
  'Hesap bilgileri güncellendi.': 'Account information updated.',
  'Hesap güncellenemedi.': 'Account could not be updated.',
  Bildirimler: 'Notifications',
  'E-posta bildirimleri': 'Email notifications',
  'Tarayıcı bildirimleri': 'Browser notifications',
  'Yeni içerik bildirimleri': 'New content notifications',
  'Deneme hatırlatmaları': 'Mock exam reminders',
  'Tekrar zamanı bildirimleri': 'Review reminders',
  'Hedef hatırlatmaları': 'Daily goal reminders',
  'Haftalık hedef bildirimleri': 'Weekly goal reminders',
  'Çalışma hatırlatmaları': 'Study reminders',
  'Destek talebi güncellemeleri': 'Support ticket updates',
  'Tarayıcı bildirimi izni verilmedi.': 'Browser notification permission was denied.',
  'Bu tarayıcı bildirimleri desteklemiyor.': 'This browser does not support notifications.',
  'Çalışma Tercihleri': 'Study Preferences',
  'Günlük hedef soru sayısı': 'Daily question goal',
  'Günlük çalışma süresi': 'Daily study time',
  'Sınav tarihi': 'Exam date',
  'Haftalık çalışma süresi': 'Weekly study time',
  'Çalışma günleri': 'Study days',
  '0=Pazar, 1=Pazartesi ... 6=Cumartesi. Örnek: 1,2,3,4,5':
    '0=Sunday, 1=Monday ... 6=Saturday. Example: 1,2,3,4,5',
  'Varsayılan quiz modu': 'Default quiz mode',
  'Varsayılan soru sayısı': 'Default question count',
  'Otomatik tekrar önerileri': 'Automatic review suggestions',
  'Quiz Tercihleri': 'Quiz Preferences',
  'Soru geçiş davranışı': 'Question transition',
  'Varsayılan quiz süresi': 'Default quiz duration',
  'Varsayılan süreli mod': 'Timed mode by default',
  'Sonuç ekranında açıklamaları otomatik aç': 'Open explanations automatically on results',
  'Yanlışları tekrar kuyruğuna otomatik ekle': 'Automatically add wrong answers to review',
  'PDF ve Not Alma': 'PDF & Note Taking',
  'Varsayılan PDF görünümü': 'Default PDF view',
  'Son kaldığım sayfayı hatırla': 'Remember my last page',
  'Notları otomatik kaydet': 'Autosave notes',
  'Vurguları göster': 'Show highlights',
  'Görünüm, Dil ve Bölgesel Ayarlar': 'Appearance, Language & Region',
  Tema: 'Theme',
  Dil: 'Language',
  'Tarih formatı': 'Date format',
  'Saat formatı': 'Time format',
  'Yoğun/kompakt görünüm': 'Dense/compact view',
  'Gizlilik ve Güvenlik': 'Privacy & Security',
  'Aktif oturumlar': 'Active sessions',
  'E-posta doğrulama': 'Email verification',
  '2FA hazırlığı': '2FA readiness',
  Doğrulandı: 'Verified',
  Bekliyor: 'Pending',
  Aktif: 'Active',
  'Hazır değil': 'Not ready',
  'Güvenlik bildirimleri': 'Security notifications',
  'Şifre değiştir': 'Change password',
  'Mevcut şifre': 'Current password',
  'Yeni şifre': 'New password',
  'Yeni şifre tekrar': 'Confirm new password',
  'En az 6 karakter kullan.': 'Use at least 6 characters.',
  'Şifreyi Güncelle': 'Update Password',
  'Tüm Cihazlardan Çıkış': 'Sign Out on All Devices',
  'Şifre güncellendi.': 'Password updated.',
  'Şifre güncellenemedi.': 'Password could not be updated.',
  'Tüm oturumlar kapatıldı.': 'All sessions were signed out.',
  'Son oturum yenileme bitişi': 'Latest session refresh expiry',
  'Konu Çalışması': 'Topic Study',
  'Materyal Görüntüleyici': 'Material Viewer',
  'Lisans Denemeleri': 'License Quizzes',
  'Deneme Detayı': 'Quiz Details',
  'Quiz Sonucu': 'Quiz Result',
  'Test Oturumu': 'Quiz Session',
  'Tekrar Testi': 'Review Quiz',
  'Konu Pratiği': 'Topic Practice',
  'Karma Pratik': 'Mixed Practice',
  'Deneme Oturumu': 'Quiz Session',
  'Tekrar Oturumu': 'Review Session',
  'Yeni Destek Talebi': 'New Support Ticket',
  'Destek Talebi Detayı': 'Support Ticket Details',
  Sayfa: 'Page',
  'Sayfa yolu': 'Breadcrumb',
  'Ana Sayfa': 'Home',
  'Özellikler': 'Features',
  'Soru Bankası': 'Question Bank',
  Lisanslar: 'Licenses',
  'Hakkımızda': 'About',
  İletişim: 'Contact',
  'Sermaye piyasası lisans hazırlık sistemi': 'Capital markets license prep system',
  'Panele Git': 'Go to Panel',
  'Giriş Yap': 'Sign In',
  'Ücretsiz Başla': 'Start Free',
  'Ücretsiz başla': 'Start Free',
  'Ücretsiz denemeyi aç': 'Open Free Trial',
  Menü: 'Menu',
  Platform: 'Platform',
  Kurumsal: 'Company',
  Yasal: 'Legal',
  'Ücretsiz Deneme': 'Free Trial',
  'Ders Notları': 'Study Notes',
  'Sık Sorulan Sorular': 'FAQ',
  Destek: 'Support',
  'Gizlilik Politikası': 'Privacy Policy',
  'Kullanım Koşulları': 'Terms of Use',
  'Public site ile öğrenci ve admin deneyimi ayrı arayüz katmanlarıyla çalışır.':
    'The public site, student experience and admin workspace run as separate interface layers.',
  'SPK Lisans Hazırlık Platformu': 'SPK License Prep Platform',
  'SPK hazırlığını tek sistemde planla, çalış ve ölç.': 'Plan, study and measure your SPK prep in one system.',
  "Ders notları, kaynak PDF'ler, onaylı soru bankası, ücretsiz deneme sınavları ve öğrenci odaklı panel deneyimiyle sınav hazırlığını dağınık araçlardan çıkarıp tek akışta topla.":
    'Bring study notes, source PDFs, approved question banks, free mock exams and a student-focused dashboard into one clear preparation flow.',
  'Çalışma akışı': 'Study flow',
  'Dağınık kaynaklardan tek bir çalışma paneline': 'From scattered resources to one study workspace',
  'Hedef lisansı seç': 'Choose your target license',
  'Ders ve konularla çalış': 'Study courses and topics',
  'Mini test ve denemeler çöz': 'Solve mini quizzes and mock exams',
  'Rapor ekranında güçlü ve zayıf alanlarını gör': 'See your strengths and weak areas in reports',
  'Aktif modül': 'Active modules',
  'Public sayfa': 'Public pages',
  'Deneme akışı': 'Mock exam flow',
  Süreli: 'Timed',
  'Ders notları': 'Study notes',
  'Lisans, ders ve konu yapısına göre düzenlenmiş özet notlarla çalış.':
    'Study with concise notes organized by license, course and topic.',
  'Soru bankası': 'Question bank',
  'Onaylı sorular, mini quiz ve süreli denemelerle bilgiyi pekiştir.':
    'Reinforce knowledge with approved questions, mini quizzes and timed mock exams.',
  'İlerleme takibi': 'Progress tracking',
  'Çalışma ritmini, tekrar ihtiyacını ve başarı oranını görünür hale getir.':
    'Make your study rhythm, review needs and success rate visible.',
  'Öğrenci deneyimi': 'Student experience',
  'Sadece içerik değil, çalışma momentumunu koruyan bir panel.':
    'More than content: a dashboard that protects study momentum.',
  'Benim Programım, derslerim, konu çalışma ekranı, raporlar, deneme geçmişi ve profil güvenliği ile günlük kullanıma uygun sade ama güçlü bir deneyim sunar.':
    'My Program, courses, topic study, reports, mock history and profile security create a simple but powerful daily workflow.',
  'SPK Akademi ile bütünleşik çalışma deneyimi': 'Integrated study experience with SPK Akademi',
  'Öğrenci ve admin için ayrı arayüz katmanları': 'Separate interface layers for students and admins',
  'PDF, not, soru ve erişim yapısının tek omurgada birleşmesi':
    'PDFs, notes, questions and access rules connected in one foundation',
  'Ürün omurgası': 'Product foundation',
  'Lisans, ders, konu, not, PDF, soru ve erişim katmanları aynı veri modeli içinde çalışır. Bu sayede arama, filtreleme, entitlement ve moderasyon akışı sistem genelinde tutarlı kalır.':
    'License, course, topic, note, PDF, question and access layers run on the same data model, keeping search, filtering, entitlement and moderation consistent.',
  'Lisans bazlı kurgu': 'License-based structure',
  'Ders ve konu hiyerarşisi': 'Course and topic hierarchy',
  'Not ve PDF arşivi': 'Notes and PDF archive',
  'Test ve deneme akışı': 'Quiz and mock exam flow',
  'Platform Özellikleri': 'Platform Features',
  'İçerik, test, yetkilendirme ve öğrenci deneyimini tek ürün mimarisinde topla.':
    'Bring content, quizzes, authorization and the student experience into one product architecture.',
  'Public pazarlama sitesi, öğrenci dashboard’u ve admin paneli birbirinden ayrılır; veri katmanı ise ortak ve sürdürülebilir kalır.':
    'The public marketing site, student dashboard and admin panel stay separate while the data layer remains shared and maintainable.',
  Yetkinlikler: 'Capabilities',
  'Platformun omurgasını oluşturan modüller': 'Modules that form the platform foundation',
  'Her modül tek başına değil, diğerleriyle birlikte anlamlı bir çalışma akışı kuracak şekilde tasarlandı.':
    'Each module is designed to work with the others as part of a meaningful study flow.',
  'Ders notları ve kaynak yönetimi': 'Study notes and source management',
  'SPK kaynak PDF’lerini ders ve konu başlıklarına bağlayarak aranabilir bir çalışma arşivi oluşturur.':
    'Connects SPK source PDFs to courses and topics to create a searchable study archive.',
  'PDF yükleme': 'PDF upload',
  'Metin çıkarma': 'Text extraction',
  'Konu bazlı notlar': 'Topic-based notes',
  'Kaynak referansı': 'Source reference',
  'Soru bankası ve testler': 'Question bank and quizzes',
  'Konu, ders ve lisans bazlı soru havuzuyla mini testler ve süreli denemeler yönetilebilir.':
    'Manage mini quizzes and timed mock exams with question pools by topic, course and license.',
  'Çoktan seçmeli sorular': 'Multiple-choice questions',
  'Açıklamalı çözümler': 'Explained solutions',
  'Zorluk seviyesi': 'Difficulty level',
  'Onay süreci': 'Approval workflow',
  'İlerleme ve başarı analizi': 'Progress and success analytics',
  'Öğrencinin doğru, yanlış ve tekrar ihtiyacını görünür hale getiren rapor ekranları sunar.':
    'Provides reports that make correct answers, mistakes and review needs visible.',
  'Konu ilerlemesi': 'Topic progress',
  'Başarı oranı': 'Success rate',
  'Tekrar zamanı': 'Review timing',
  'Zayıf konu takibi': 'Weak topic tracking',
  'AI hazırlık altyapısı': 'AI-ready foundation',
  'Sistem, ileride AI servisleri entegre edilebilecek şekilde modellenmiştir; ancak yerleşik üretim akışı henüz aktif değildir.':
    'The system is modeled for future AI integrations, though built-in generation is not active yet.',
  'İçerik işaretleme alanı': 'Content labeling area',
  'Review sürecine uyum': 'Review workflow fit',
  'Genişletilebilir veri modeli': 'Extensible data model',
  'Planlanan entegrasyon noktaları': 'Planned integration points',
  'Arama ve filtreleme': 'Search and filtering',
  'Lisans, ders, konu ve durum bazlı arama deneyimi hem public hem dashboard tarafında kullanılabilir.':
    'Search by license, course, topic and status across the public site and dashboards.',
  'Konu filtresi': 'Topic filter',
  'Ders filtresi': 'Course filter',
  'Metin arama': 'Text search',
  'Durum ayrımı': 'Status separation',
  'Lisans bazlı yapı': 'License-based structure',
  'Düzey 1, Düzey 2, Düzey 3 ve Türev Araçlar gibi farklı lisanslar için ayrı çalışma akışları kurar.':
    'Creates separate study flows for licenses such as Level 1, Level 2, Level 3 and Derivatives.',
  'Lisans katalogları': 'License catalogs',
  'Ders eşleştirme': 'Course mapping',
  'Konu sıralaması': 'Topic ordering',
  'İçerik kapsamı': 'Content scope',
  'Planlanan AI özellikleri': 'Planned AI features',
  'Bu başlıklar ürün yol haritasında yer alır; şu an sistem içinde aktif üretim servisi olarak çalışmaz.':
    'These items are on the product roadmap and do not currently run as active generation services.',
  'AI soru üretimi': 'AI question generation',
  'PDF ve konu bağlamından taslak çoktan seçmeli soru üretimi planlanıyor.':
    'Draft multiple-choice question generation from PDFs and topic context is planned.',
  'AI konu özeti': 'AI topic summaries',
  'Kaynak belgelerden editör incelemesine girecek özet taslakları oluşturulacak.':
    'Draft summaries from source documents will be prepared for editor review.',
  'Akıllı quiz önerileri': 'Smart quiz recommendations',
  'İlerleme ve yanlış soru geçmişine göre kişiselleştirilmiş quiz önerileri eklenecek.':
    'Personalized quiz recommendations based on progress and mistake history will be added.',
}

const LocalizationContext = createContext<LocalizationContextValue | null>(null)

export function LocalizationProvider({
  children,
  settings,
}: {
  children: ReactNode
  settings?: UserSettings
}) {
  const [publicLanguage, setPublicLanguage] = useState<UserLanguagePreference>(() => readPublicLanguage())
  const language = settings?.language ?? publicLanguage
  const locale = language === UserLanguagePreference.English ? 'en-US' : 'tr-TR'

  useEffect(() => {
    if (settings?.language) {
      setPublicLanguage(settings.language)
    }
  }, [settings?.language])

  useEffect(() => {
    document.documentElement.lang = language === UserLanguagePreference.English ? 'en' : 'tr'
  }, [language])

  const value = useMemo<LocalizationContextValue>(() => {
    const dateFormat = settings?.dateFormat ?? UserDateFormatPreference.DayMonthYear
    const hour12 = settings?.timeFormat === UserTimeFormatPreference.TwelveHour
    const parse = (input?: string | Date | null) => {
      if (!input) return null
      const date = input instanceof Date ? input : new Date(input)
      return Number.isNaN(date.getTime()) ? null : date
    }

    return {
      language,
      locale,
      setLanguage: (nextLanguage) => {
        setPublicLanguage(nextLanguage)
        window.localStorage.setItem(publicLanguageStorageKey, String(nextLanguage))
      },
      t: (text) => (language === UserLanguagePreference.English ? english[text] ?? text : text),
      formatDate: (input) => {
        const date = parse(input)
        return date ? formatNumericDate(date, dateFormat) : '-'
      },
      formatDateTime: (input) => {
        const date = parse(input)
        if (!date) return '-'
        const time = new Intl.DateTimeFormat(locale, {
          hour: '2-digit',
          minute: '2-digit',
          hour12,
        }).format(date)
        return `${formatNumericDate(date, dateFormat)} ${time}`
      },
      formatTime: (input) => {
        const date = parse(input)
        return date
          ? new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hour12 }).format(date)
          : '-'
      },
    }
  }, [language, locale, settings?.dateFormat, settings?.timeFormat])

  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>
}

function readPublicLanguage() {
  if (typeof window === 'undefined') {
    return UserLanguagePreference.Turkish
  }

  const stored = Number(window.localStorage.getItem(publicLanguageStorageKey))
  return stored === UserLanguagePreference.English ? UserLanguagePreference.English : UserLanguagePreference.Turkish
}

export function useLocalization() {
  const value = useContext(LocalizationContext)
  if (!value) {
    throw new Error('useLocalization must be used within LocalizationProvider')
  }
  return value
}

function formatNumericDate(date: Date, preference: UserDateFormatPreference) {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = String(date.getFullYear())

  if (preference === UserDateFormatPreference.YearMonthDay) {
    return `${year}-${month}-${day}`
  }

  if (preference === UserDateFormatPreference.MonthDayYear) {
    return `${month}/${day}/${year}`
  }

  return `${day}.${month}.${year}`
}
