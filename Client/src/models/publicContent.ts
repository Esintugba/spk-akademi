import type { ContentAccessLevel, TrialExamDifficulty } from './enums'
import type { QuizQuestionOption } from './quiz'

export interface PublicQuestion {
  id: string
  topicId: string
  topicTitle: string
  text: string
  sourceReference?: string | null
  accessLevel: ContentAccessLevel
  options: QuizQuestionOption[]
}

export interface StartPublicMiniQuiz {
  questionCount: number
  accessLevel: ContentAccessLevel
}

export interface PublicMiniQuizResult {
  totalQuestions: number
  correctCount: number
  wrongCount: number
  successRate: number
  answers: PublicMiniQuizResultAnswer[]
}

export interface PublicMiniQuizResultAnswer {
  questionId: string
  selectedOptionId?: string | null
  isCorrect: boolean
  explanation: string
}

export interface PublicTrialExamSummary {
  id: string
  title: string
  slug: string
  description: string
  durationMinutes: number
  questionCount: number
  isFree: boolean
  isFeatured: boolean
  difficultyLevel: TrialExamDifficulty
  tags?: string | null
}

export type PublicExampleTrial = PublicTrialExamSummary
