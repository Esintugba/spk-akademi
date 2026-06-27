import type { ContentAccessLevel, QuestionDifficulty, QuestionType, QuizMode, ReviewStatus } from './enums'
import type { UnlockedBadge } from './gamification'

export interface StartQuiz {
  mode: QuizMode
  courseId?: string | null
  topicId?: string | null
  questionCount: number
}

export interface QuizAttempt {
  id: string
  mode: QuizMode
  courseId?: string | null
  topicId?: string | null
  trialExamId?: string | null
  startedAt: string
  finishedAt?: string | null
  durationMinutes?: number | null
  expiresAt?: string | null
  isExpired: boolean
  totalQuestions: number
  correctCount: number
  wrongCount: number
  questions: QuizQuestion[]
}

export interface QuizQuestion {
  id: string
  text: string
  difficulty: QuestionDifficulty
  type: QuestionType
  options: QuizQuestionOption[]
}

export interface QuizQuestionOption {
  id: string
  label: string
  text: string
}

export interface SubmitQuiz {
  answers: SubmitQuizAnswer[]
}

export interface SubmitQuizAnswer {
  questionId: string
  selectedOptionId?: string | null
  timeSpentSeconds?: number | null
}

export interface QuizResult {
  id: string
  totalQuestions: number
  correctCount: number
  wrongCount: number
  successRate: number
  answers: QuizResultAnswer[]
  unlockedBadges: UnlockedBadge[]
}

export interface QuizResultAnswer {
  questionId: string
  selectedOptionId?: string | null
  correctOptionId: string
  isCorrect: boolean
  explanation: string
}

export interface TrialExamSummary {
  id: string
  title: string
  slug: string
  description: string
  licenseId?: string | null
  durationMinutes: number
  questionCount: number
  isFree: boolean
  isPublished: boolean
  assignedQuestionCount: number
  reviewStatus: ReviewStatus
  accessLevel: ContentAccessLevel
  reviewedBy?: string | null
  reviewedAt?: string | null
  reviewComment?: string | null
}

export interface TrialExamDetail extends TrialExamSummary {
  questionIds: string[]
}

export interface CreateTrialExam {
  title: string
  slug: string
  description: string
  licenseId?: string | null
  durationMinutes: number
  questionCount: number
  isFree: boolean
  isPublished: boolean
  reviewStatus: ReviewStatus
  accessLevel: ContentAccessLevel
  questionIds: string[]
}

export type UpdateTrialExam = CreateTrialExam
