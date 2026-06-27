import type { ExamSession, ExamType, QuestionDifficulty, QuestionType, QuizMode } from './enums'

export interface PastExamQuestion {
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
}

export interface PastExamQuestionListResponse {
  items: PastExamQuestion[]
  totalCount: number
  page: number
  pageSize: number
}

export interface StartPastExamQuizRequest {
  examTypes?: ExamType[] | null
  years?: number[] | null
  questionCount: number
  onlyPastExamQuestions: boolean
  topicIds?: string[] | null
  session?: ExamSession | null
  difficulty?: QuestionDifficulty | null
  mixedYears?: boolean
}

export interface PastExamQuizStartResponse {
  attemptId: string
  quizMode: QuizMode
  questionCount: number
  generatedAt: string
  estimatedDurationSeconds: number
}

export interface PastExamAnalytics {
  totalSolved: number
  correctRate: number
  strongYears: number[]
  weakYears: number[]
  bestExamType?: ExamType | null
  worstTopic?: string | null
  yearRates: { year: number; correctRate: number; totalSolved: number }[]
  examTypeRates: { examType: ExamType; correctRate: number; totalSolved: number }[]
  weakTopics: { topicId: string; topicTitle: string; correctRate: number; totalSolved: number }[]
}

