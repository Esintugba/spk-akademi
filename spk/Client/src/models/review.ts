import type { UnlockedBadge } from './gamification'

export enum MasteryLevel {
  Beginner = 0,
  Intermediate = 1,
  Advanced = 2,
  Mastered = 3,
}

export interface TodayReviewSummary {
  dueTodayCount: number
  masteredCount: number
  dailyStreak: number
  averageSuccessRate: number
}

export interface TodayReviewItem {
  questionId: string
  questionText: string
  topicId: string
  topicTitle: string
  courseName: string
  masteryLevel: MasteryLevel
  nextReviewAt: string | null
  correctRate: number
  intervalDays: number
  easeFactor: number
}

export interface TodayReviewResponse {
  items: TodayReviewItem[]
  summary: TodayReviewSummary
}

export interface ReviewSessionQuestion {
  questionId: string
  order: number
  questionText: string
  masteryLevel: MasteryLevel
  options: { id: string; label: string; text: string }[]
}

export interface ReviewSessionResponse {
  sessionId: string
  startedAt: string
  expiresAt: string
  questionCount: number
  questions: ReviewSessionQuestion[]
}

export interface StartReviewSessionRequest {
  maxQuestions?: number
}

export interface SubmitReviewAnswer {
  questionId: string
  quality: number
  answeredCorrect?: boolean
  responseTimeSeconds?: number
}

export interface SubmitReviewSessionRequest {
  sessionId: string
  answers: SubmitReviewAnswer[]
}

export interface ReviewAnswerResult {
  questionId: string
  quality: number
  newIntervalDays: number
  nextReviewAt: string
  masteryLevel: MasteryLevel
}

export interface SubmitReviewSessionResult {
  sessionId: string
  questionCount: number
  correctCount: number
  averageQuality: number
  retentionRate: number
  results: ReviewAnswerResult[]
  unlockedBadges: UnlockedBadge[]
}

export interface ReviewTrendPoint {
  date: string
  reviewCount: number
  successRate: number
}

export interface ReviewMasteryDistribution {
  level: MasteryLevel
  count: number
}

export interface ReviewWeakTopic {
  topicId: string
  topicTitle: string
  courseName: string
  dueCount: number
  successRate: number
}

export interface ReviewStats {
  dueTodayCount: number
  masteredCount: number
  totalTrackedQuestions: number
  dailyStreak: number
  averageSuccessRate: number
  retentionRate: number
  dailyTrend: ReviewTrendPoint[]
  masteryDistribution: ReviewMasteryDistribution[]
  weakTopics: ReviewWeakTopic[]
}
