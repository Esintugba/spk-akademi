import type { QuestionDifficulty } from './enums'
import { QuizMode } from './enums'

export interface WrongAnswerStats {
  totalWrongQuestions: number
  dueForReview: number
  masteredQuestions: number
  todaySolved: number
  weeklyAccuracy: number
  weakTopics: WeakTopicInsight[]
}

export interface WeakTopicInsight {
  topicId: string
  topicTitle: string
  courseName: string
  wrongCount: number
  successRate: number
}

export interface WrongAnswerQueueItem {
  questionId: string
  questionText: string
  topicId: string
  topicTitle: string
  courseId: string
  courseName: string
  difficulty: QuestionDifficulty
  wrongCount: number
  reviewCount: number
  lastWrongAt: string
  nextReviewAt: string
  lastReviewedAt: string | null
  isMastered: boolean
  successRate: number
}

export interface WrongAnswerQueuePage {
  items: WrongAnswerQueueItem[]
  page: number
  pageSize: number
  totalCount: number
  hasNextPage: boolean
}

export interface StartWrongAnswersQuizRequest {
  questionCount: number
  courseId?: string | null
  topicId?: string | null
  difficulty?: QuestionDifficulty | null
}

export interface WrongAnswersQuizStartResponse {
  attemptId: string
  quizMode: QuizMode
  questionCount: number
  generatedAt: string
  estimatedDuration: number
}
