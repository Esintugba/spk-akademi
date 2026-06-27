export const branding = {
  appName: 'SPK Akademi',
  shortName: 'SPK Akademi',
  tagline: 'SPK Lisanslama Hazırlık Platformu',
  defaultTitle: 'SPK Akademi - SPK Lisanslama Hazırlık Platformu',
  defaultDescription: 'SPK sınavlarına profesyonel hazırlık platformu.',
  defaultKeywords:
    'SPK, lisans, sermaye piyasası, ders notları, deneme sınavı, soru bankası, çalışma platformu',
  supportEmail: 'destek@spkakademi.com',
  copyrightYear: 2026,
  apiTitle: 'SPK Akademi API',
  themeColor: '#0f766e',
  publicSiteUrl: import.meta.env.VITE_PUBLIC_SITE_URL ?? 'https://spkakademi.com',
  defaultImageUrl: '/social-preview.svg',
} as const

export type Branding = typeof branding

export function buildPageTitle(pageTitle?: string) {
  if (!pageTitle?.trim()) {
    return branding.defaultTitle
  }

  return `${branding.appName} | ${pageTitle.trim()}`
}

export function buildCopyright(notice = 'Tüm hakları saklıdır.') {
  return `© ${branding.copyrightYear} ${branding.appName}. ${notice}`
}

/** Route path → sayfa başlığı (öğrenci/admin paneli) */
export const appRouteTitles: Record<string, string> = {
  '/dashboard': 'Panelim',
  '/onboarding': 'Hoş Geldin',
  '/dashboard/access-requests': 'Erişim Başvurularım',
  '/my-courses': 'Derslerim',
  '/my-topics': 'Konularım',
  '/my-materials': 'Kaynaklarım',
  '/my-notes': 'Notlarım',
  '/my-trials': 'Denemelerim',
  '/trials': 'Sonuçlarım',
  '/quizzes': 'Deneme Kataloğu',
  '/quiz': 'Soru Bankası',
  '/quiz/course-practice': 'Ders Pratiği',
  '/quiz/wrong-answers': 'Yanlışlarım',
  '/mixed-practice': 'Karışık Test',
  '/questions/past-exams': 'Çıkmış Sorular',
  '/reviews/today': 'Bugün Tekrar Et',
  '/reports': 'Raporlar',
  '/goals': 'Hedeflerim',
  '/gamification': 'Rozetler',
  '/leaderboard': 'Liderlik Tablosu',
  '/support/my-tickets': 'Destek Taleplerim',
  '/support/new': 'Yeni Destek Talebi',
  '/settings': 'Ayarlar',
  '/profile': 'Profil',
  '/profile/achievements': 'Başarımlar',
  '/admin': 'Admin Özeti',
  '/admin/licenses': 'Lisanslar',
  '/admin/courses': 'Dersler',
  '/admin/topics': 'Konular',
  '/admin/notes': 'Ders Notları',
  '/admin/questions': 'Sorular',
  '/admin/sources': 'Kaynaklar',
  '/admin/trial-exams': 'Denemeler',
  '/admin/moderation': 'Moderasyon',
  '/admin/access': 'Erişimler',
  '/admin/access-requests': 'Erişim Başvuruları',
  '/admin/contact-messages': 'İletişim Mesajları',
  '/admin/support-tickets': 'Destek Talepleri',
  '/admin/blog': 'Blog CMS',
  '/admin/import': 'Toplu Import',
  '/admin/consents': 'Çerez/KVKK',
  '/admin/badges': 'Rozetler',
  '/login': 'Giriş Yap',
  '/register': 'Kayıt Ol',
}

export function resolveRouteTitle(pathname: string) {
  if (appRouteTitles[pathname]) {
    return appRouteTitles[pathname]
  }

  if (pathname.startsWith('/quiz/results/')) {
    return 'Quiz Sonucu'
  }

  if (pathname.startsWith('/quiz/session/') || pathname.startsWith('/quiz/licensed/')) {
    return 'Deneme Oturumu'
  }

  if (pathname.startsWith('/quiz/free/')) {
    return 'Ücretsiz Deneme'
  }

  if (pathname.startsWith('/quiz/course-practice/')) {
    return 'Ders Pratiği Oturumu'
  }

  if (pathname.startsWith('/quiz/wrong-answers/')) {
    return 'Yanlışlarım Oturumu'
  }

  if (pathname.startsWith('/reviews/session/')) {
    return 'Tekrar Oturumu'
  }

  if (pathname.startsWith('/study/')) {
    return 'Konu Çalışması'
  }

  if (pathname.startsWith('/trials/')) {
    return 'Deneme Detayı'
  }

  return undefined
}
