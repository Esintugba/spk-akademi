import type { QuizMode } from './enums'

export enum QuizAttemptStatus {
  NotStarted = 0,
  Started = 1,
  InProgress = 2,
  Completed = 3,
  Expired = 4,
}

export interface QuizSession {
  attemptId: string
  quizMode: QuizMode
  status: QuizAttemptStatus
  route: string
  remainingTimeSeconds: number | null
  canResume: boolean
  startedAt: string
  lastActivityAt: string | null
  expiresAt: string | null
  title: string | null
}

export interface ActiveQuizSession {
  attemptId: string
  quizMode: QuizMode
  status: QuizAttemptStatus
  route: string
  remainingTimeSeconds: number | null
  startedAt: string
  lastActivityAt: string | null
  title: string | null
}
