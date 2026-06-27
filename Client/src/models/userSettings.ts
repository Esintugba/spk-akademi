export enum UserThemePreference {
  Light = 1,
  Dark = 2,
  System = 3,
}

export enum UserLanguagePreference {
  Turkish = 1,
  English = 2,
}

export enum UserDateFormatPreference {
  DayMonthYear = 1,
  YearMonthDay = 2,
  MonthDayYear = 3,
}

export enum UserTimeFormatPreference {
  TwentyFourHour = 1,
  TwelveHour = 2,
}

export enum UserDefaultQuizMode {
  Mixed = 1,
  Topic = 2,
  Course = 3,
  WrongAnswers = 4,
  TrialExam = 5,
}

export enum UserQuestionTransitionPreference {
  Manual = 1,
  AfterAnswer = 2,
  AfterCorrectAnswer = 3,
}

export enum UserPdfViewPreference {
  Pdf = 1,
  Text = 2,
  Split = 3,
}

export interface UserSettings {
  userId: string
  theme: UserThemePreference
  language: UserLanguagePreference
  dateFormat: UserDateFormatPreference
  timeFormat: UserTimeFormatPreference
  compactView: boolean
  emailNotifications: boolean
  pushNotifications: boolean
  newContentNotifications: boolean
  trialReminders: boolean
  reviewReminder: boolean
  dailyGoalReminder: boolean
  weeklyGoalReminder: boolean
  studyReminders: boolean
  supportTicketUpdates: boolean
  dailyGoalQuestionCount: number
  dailyStudyMinutes: number
  examDate?: string | null
  weeklyStudyMinutes: number
  preferredStudyDays: string
  defaultQuizMode: UserDefaultQuizMode
  defaultQuestionCount: number
  autoReviewSuggestions: boolean
  timedQuizDefault: boolean
  defaultQuizDurationMinutes: number
  autoOpenExplanations: boolean
  questionTransition: UserQuestionTransitionPreference
  autoAddWrongAnswersToReview: boolean
  preferredPdfView: UserPdfViewPreference
  rememberLastPdfPage: boolean
  autoSaveNotes: boolean
  showHighlights: boolean
  securityNotifications: boolean
  createdAt: string
  updatedAt?: string | null
}

export type UpdateUserSettings = Omit<UserSettings, 'userId' | 'createdAt' | 'updatedAt'>

export interface UserSecuritySettings {
  email: string
  displayName: string
  emailConfirmed: boolean
  twoFactorReady: boolean
  activeSessionCount: number
  refreshTokenExpiresAt?: string | null
  createdAt: string
  securityNotifications: boolean
}

export const themeOptions = [
  { value: UserThemePreference.Light, label: 'Açık Tema' },
  { value: UserThemePreference.Dark, label: 'Koyu Tema' },
  { value: UserThemePreference.System, label: 'Sistem Teması' },
] as const

export const languageOptions = [
  { value: UserLanguagePreference.Turkish, label: 'Türkçe' },
  { value: UserLanguagePreference.English, label: 'English' },
] as const

export const dateFormatOptions = [
  { value: UserDateFormatPreference.DayMonthYear, label: 'GG.AA.YYYY' },
  { value: UserDateFormatPreference.YearMonthDay, label: 'YYYY-AA-GG' },
  { value: UserDateFormatPreference.MonthDayYear, label: 'AA/GG/YYYY' },
] as const

export const timeFormatOptions = [
  { value: UserTimeFormatPreference.TwentyFourHour, label: '24 saat' },
  { value: UserTimeFormatPreference.TwelveHour, label: '12 saat' },
] as const

export const quizModeOptions = [
  { value: UserDefaultQuizMode.Mixed, label: 'Karışık Test' },
  { value: UserDefaultQuizMode.Topic, label: 'Alt Konu Testi' },
  { value: UserDefaultQuizMode.Course, label: 'Ders Bazlı Test' },
  { value: UserDefaultQuizMode.WrongAnswers, label: 'Yanlışlarım' },
  { value: UserDefaultQuizMode.TrialExam, label: 'Deneme' },
] as const

export const questionTransitionOptions = [
  { value: UserQuestionTransitionPreference.Manual, label: 'Manuel' },
  { value: UserQuestionTransitionPreference.AfterAnswer, label: 'Cevaptan sonra otomatik' },
] as const

export const pdfViewOptions = [
  { value: UserPdfViewPreference.Pdf, label: 'PDF' },
  { value: UserPdfViewPreference.Text, label: 'Metin' },
  { value: UserPdfViewPreference.Split, label: 'Bölünmüş görünüm' },
] as const
