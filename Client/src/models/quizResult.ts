import type { QuestionDifficulty, QuizMode } from './enums'

export interface QuizResultDetail {
  attemptId: string
  quizTitle: string
  quizMode: QuizMode
  courseId: string | null
  courseName: string | null
  score: number
  correctCount: number
  wrongCount: number
  emptyCount: number
  durationSeconds: number
  completedAt: string | null
  analytics: QuizResultAnalytics
  answers: QuizResultDetailAnswer[]
  page: number
  pageSize: number
  totalAnswerCount: number
  hasNextPage: boolean
}

export interface QuizResultAnalytics {
  strongTopics: QuizTopicPerformance[]
  weakTopics: QuizTopicPerformance[]
  averageQuestionTimeSeconds: number
  fastestQuestion: QuizQuestionTimeInsight | null
  slowestQuestion: QuizQuestionTimeInsight | null
}

export interface QuizTopicPerformance {
  topicId: string
  topicName: string
  lessonName: string
  totalQuestions: number
  correctCount: number
  successRate: number
}

export interface QuizQuestionTimeInsight {
  questionId: string
  questionText: string
  timeSpentSeconds: number
}

export interface QuizResultDetailAnswer {
  questionId: string
  order: number
  questionText: string
  options: QuizResultOption[]
  selectedOptionId: string | null
  correctOptionId: string
  isCorrect: boolean
  isEmpty: boolean
  explanation: QuizExplanation | null
  topicId: string
  topicName: string
  lessonName: string
  difficultyLevel: QuestionDifficulty
  timeSpentSeconds: number | null
}

export interface QuizResultOption {
  id: string
  label: string
  text: string
  isCorrect: boolean
  isSelected: boolean
}

export interface QuizExplanation {
  explanation: string
  solutionNote: string | null
  defaultExpanded: boolean
}
