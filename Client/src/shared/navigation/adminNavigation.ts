export type PageKey =
  | 'dashboard'
  | 'licenses'
  | 'courses'
  | 'topics'
  | 'notes'
  | 'questions'
  | 'sourceDocuments'
  | 'quiz'
  | 'trialExams'
  | 'moderation'
  | 'access'
  | 'accessRequests'
  | 'contactMessages'
  | 'supportTickets'
  | 'blog'
  | 'import'
  | 'consents'
  | 'badges'
  | 'login'
  | 'register'

export interface NavigationItem {
  key: PageKey
  label: string
  path: string
}

export const navigationItems: NavigationItem[] = [
  { key: 'dashboard', label: 'Admin Özeti', path: '/admin' },
  { key: 'licenses', label: 'Lisanslar', path: '/admin/licenses' },
  { key: 'courses', label: 'Dersler', path: '/admin/courses' },
  { key: 'topics', label: 'Konular', path: '/admin/topics' },
  { key: 'notes', label: 'Notlar', path: '/admin/notes' },
  { key: 'questions', label: 'Sorular', path: '/admin/questions' },
  { key: 'sourceDocuments', label: 'Kaynaklar', path: '/admin/sources' },
  { key: 'quiz', label: 'Test', path: '/quiz' },
  { key: 'trialExams', label: 'Denemeler', path: '/admin/trial-exams' },
  { key: 'moderation', label: 'Moderasyon', path: '/admin/moderation' },
  { key: 'access', label: 'Erişimler', path: '/admin/access' },
  { key: 'accessRequests', label: 'Erişim Başvuruları', path: '/admin/access-requests' },
  { key: 'contactMessages', label: 'İletişim Mesajları', path: '/admin/contact-messages' },
  { key: 'supportTickets', label: 'Destek Talepleri', path: '/admin/support-tickets' },
  { key: 'blog', label: 'Blog CMS', path: '/admin/blog' },
  { key: 'import', label: 'Toplu Import', path: '/admin/import' },
  { key: 'badges', label: 'Rozetler', path: '/admin/badges' },
  { key: 'consents', label: 'Çerez/KVKK', path: '/admin/consents' },
  { key: 'login', label: 'Giriş', path: '/login' },
  { key: 'register', label: 'Kayıt Ol', path: '/register' },
]
