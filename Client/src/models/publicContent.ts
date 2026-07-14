import type { ContentAccessLevel } from './enums'
import type { QuizQuestionOption } from './quiz'
import type { QuestionDifficulty } from './enums'

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
  difficultyLevel: QuestionDifficulty
  tags?: string | null
}

export type PublicExampleTrial = PublicTrialExamSummary
