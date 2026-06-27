import type { QuestionDifficulty } from './enums'
import { QuizMode } from './enums'

export interface CoursePracticeCourseOption {
  courseId: string
  licenseId: string
  licenseName: string
  courseName: string
  totalQuestionCount: number
  topicCount: number
  successRate: number
  progressPercentage: number
}

export interface StartCoursePracticeQuizRequest {
  courseId: string
  questionCount: number
  difficultyLevels?: QuestionDifficulty[]
  topicIds?: string[]
  includeWrongAnswered: boolean
  randomizeQuestions: boolean
  randomizeOptions: boolean
}

export interface CoursePracticeQuizStartResponse {
  attemptId: string
  quizMode: QuizMode
  courseId: string
  courseName: string
  questionCount: number
  estimatedDurationSeconds: number
  generatedAt: string
}
