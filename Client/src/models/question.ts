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

export interface QuestionListItem {
  id: string
  topicId: string
  topicTitle: string
  text: string
  difficulty: QuestionDifficulty
  type: QuestionType
  isPastExamQuestion: boolean
  examYear?: number | null
  examType?: ExamType | null
  examSession?: ExamSession | null
  sourceReference?: string | null
  reviewStatus: ReviewStatus
  accessLevel: ContentAccessLevel
  optionCount: number
}

export interface QuestionListResponse {
  items: QuestionListItem[]
  totalCount: number
  page: number
  pageSize: number
}

export interface QuestionListQuery {
  topicId?: string
  difficulty?: QuestionDifficulty
  reviewStatus?: ReviewStatus
  isPastExamQuestion?: boolean
  search?: string
  page?: number
  pageSize?: number
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

export interface UpdateQuestionOption extends CreateQuestionOption {
  id?: string | null
}

export interface UpdateQuestion extends Omit<CreateQuestion, 'options'> {
  options: UpdateQuestionOption[]
}
