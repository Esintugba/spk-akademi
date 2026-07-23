import type { QuestionDifficulty } from './enums'

export enum AiQuestionGenerationJobStatus {
  Pending = 1,
  Processing = 2,
  Completed = 3,
  Failed = 4,
}

export enum AiQuestionDraftStatus {
  PendingReview = 1,
  Approved = 2,
  Rejected = 3,
  Published = 4,
}

export interface CreateAiQuestionGenerationJob {
  sourceDocumentId: string
  topicId: string
  startPage: number
  endPage: number
  easyQuestionCount: number
  mediumQuestionCount: number
  hardQuestionCount: number
  includeExplanations: boolean
}

export interface AiQuestionGenerationJob extends CreateAiQuestionGenerationJob {
  id: string
  sourceDocumentTitle: string
  topicTitle: string
  model: string
  status: AiQuestionGenerationJobStatus
  generatedQuestionCount: number
  inputTokens: number
  outputTokens: number
  errorMessage: string | null
  createdAt: string
  startedAt: string | null
  completedAt: string | null
}

export interface AiQuestionDraft {
  id: string
  jobId: string
  questionText: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  optionE: string | null
  correctOption: string
  explanation: string
  difficulty: QuestionDifficulty
  sourcePage: number
  sourceExcerpt: string
  status: AiQuestionDraftStatus
  publishedQuestionId: string | null
}

export type UpdateAiQuestionDraft = Omit<
  AiQuestionDraft,
  'id' | 'jobId' | 'status' | 'publishedQuestionId'
>
