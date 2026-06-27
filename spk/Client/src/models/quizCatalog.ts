export const QuestionDifficulty = {
  Easy: 1,
  Medium: 2,
  Hard: 3,
} as const

export type QuestionDifficulty = (typeof QuestionDifficulty)[keyof typeof QuestionDifficulty]

export interface StudentQuizProgress {
  completed: boolean
  inProgress: boolean
  activeAttemptId: string | null
  lastScore: number | null
  lastAttemptAt: string | null
}

export interface QuizCatalogItem {
  id: string
  title: string
  slug: string
  description: string
  licenseName: string | null
  licenseId: string | null
  questionCount: number
  duration: number
  difficultyLevel: QuestionDifficulty
  attemptCount: number
  averageScore: number
  completionRate: number
  abandonRate: number
  isFree: boolean
  hasAccess: boolean
  isFeatured: boolean
  tags: string[]
  userProgress: StudentQuizProgress
}

export interface QuizCatalogResponse {
  items: QuizCatalogItem[]
  page: number
  pageSize: number
  totalCount: number
  hasNextPage: boolean
}

export interface FeaturedQuiz {
  id: string
  title: string
  licenseName: string | null
  questionCount: number
  duration: number
  difficultyLevel: QuestionDifficulty
  popularityScore: number
  averageScore: number
  isFree: boolean
  hasAccess: boolean
}

export interface QuizQuestionDistribution {
  courseId: string
  courseName: string
  topicId: string
  topicTitle: string
  questionCount: number
}

export interface QuizOverview extends QuizCatalogItem {
  questionDistribution: QuizQuestionDistribution[]
}

export interface QuizCatalogFilters {
  licenseId?: string
  courseId?: string
  topicId?: string
  status?: 'available' | 'completed' | 'in-progress' | ''
  difficulty?: 'easy' | 'medium' | 'hard' | ''
  sortBy?: 'newest' | 'popular' | 'highest-rated' | 'shortest-duration' | 'highest-success-rate'
  isFree?: boolean
  search?: string
}
