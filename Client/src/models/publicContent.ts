import type { ContentAccessLevel } from './enums'
import type { QuizQuestionOption, TrialExamSummary } from './quiz'

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

export type PublicExampleTrial = TrialExamSummary
