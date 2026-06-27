export const StudentTrialProgressStatus = {
  NotStarted: 0,
  InProgress: 1,
  Completed: 2,
} as const

export type StudentTrialProgressStatus =
  (typeof StudentTrialProgressStatus)[keyof typeof StudentTrialProgressStatus]

export const QuizAttemptStatus = {
  NotStarted: 0,
  Started: 1,
  InProgress: 2,
  Completed: 3,
  Expired: 4,
} as const

export type QuizAttemptStatus = (typeof QuizAttemptStatus)[keyof typeof QuizAttemptStatus]

export interface StudentAccessibleTrial {
  quizId: string
  title: string
  licenseName: string | null
  licenseId: string | null
  durationMinutes: number
  questionCount: number
  isFree: boolean
  progressStatus: StudentTrialProgressStatus
  activeAttemptId: string | null
  remainingTimeSeconds: number | null
  lastAttemptAt: string | null
  lastSuccessRate: number | null
}

export interface StartLicensedQuizRequest {
  quizId: string
}

export interface QuizAttemptStartResponse {
  attemptId: string
  quizId: string
  startedAt: string
  remainingTime: number
  status: QuizAttemptStatus
}
