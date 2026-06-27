import type { ContentAccessLevel, ExamSession, ExamType, QuestionDifficulty, QuestionType, ReviewStatus } from './enums'

export interface Question {
  id: string
  topicId: string
  text: string
  difficulty: QuestionDifficulty
  type: QuestionType
  explanation: string
  isPastExamQuestion: boolean
  examYear?: number | null
  examType?: ExamType | null
  examSession?: ExamSession | null
  sourceReference?: string | null
  sourceText?: string | null
  isAiGenerated: boolean
  reviewStatus: ReviewStatus
  accessLevel: ContentAccessLevel
  reviewedBy?: string | null
  reviewedAt?: string | null
  reviewComment?: string | null
  options: QuestionOption[]
}

export interface QuestionOption {
  id: string
  label: string
  text: string
  isCorrect: boolean
}

export interface CreateQuestion {
  topicId: string
  text: string
  difficulty: QuestionDifficulty
  type: QuestionType
  explanation: string
  isPastExamQuestion: boolean
  examYear?: number | null
  examType?: ExamType | null
  examSession?: ExamSession | null
  sourceReference?: string | null
  sourceText?: string | null
  isAiGenerated: boolean
  reviewStatus: ReviewStatus
  accessLevel: ContentAccessLevel
  options: CreateQuestionOption[]
}

export interface CreateQuestionOption {
  label: string
  text: string
  isCorrect: boolean
}

export type UpdateQuestion = CreateQuestion
