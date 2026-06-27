/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, type ReactNode } from 'react'
import {
  UserDateFormatPreference,
  UserLanguagePreference,
  UserTimeFormatPreference,
  type UserSettings,
} from '../../models'

type LocalizationContextValue = {
  language: UserLanguagePreference
  locale: 'tr-TR' | 'en-US'
  t: (text: string) => string
  formatDate: (value?: string | Date | null) => string
  formatDateTime: (value?: string | Date | null) => string
  formatTime: (value?: string | Date | null) => string
}

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
}

const LocalizationContext = createContext<LocalizationContextValue | null>(null)

export function LocalizationProvider({
  children,
  settings,
}: {
  children: ReactNode
  settings?: UserSettings
}) {
  const language = settings?.language ?? UserLanguagePreference.Turkish
  const locale = language === UserLanguagePreference.English ? 'en-US' : 'tr-TR'

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
