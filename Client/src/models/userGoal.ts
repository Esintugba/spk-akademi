export const UserGoalType = {
  QuestionCount: 1,
  StudyMinutes: 2,
  CompletedTopics: 3,
  CompletedCourses: 4,
  TrialExamCount: 5,
  ReviewCount: 6,
} as const

export type UserGoalType = (typeof UserGoalType)[keyof typeof UserGoalType]

export const UserGoalStatus = {
  Active: 1,
  Completed: 2,
  Archived: 3,
} as const

export type UserGoalStatus = (typeof UserGoalStatus)[keyof typeof UserGoalStatus]

export interface UserGoal {
  id: string
  title: string
  description?: string | null
  goalType: UserGoalType
  targetValue: number
  currentValue: number
  progressPercentage: number
  startDate: string
  targetDate: string
  daysRemaining: number
  status: UserGoalStatus
  isOverdue: boolean
  completedAt?: string | null
  createdAt: string
}

export interface CreateUserGoalRequest {
  title: string
  description?: string | null
  goalType: UserGoalType
  targetValue: number
  startDate: string
  targetDate: string
}

export interface UpdateUserGoalRequest {
  title: string
  description?: string | null
  targetValue: number
  startDate: string
  targetDate: string
  status: UserGoalStatus
}
