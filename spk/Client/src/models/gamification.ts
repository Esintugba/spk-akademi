export const LeaderboardPeriod = {
  Daily: 1,
  Weekly: 2,
  Monthly: 3,
  Global: 4,
} as const

export type LeaderboardPeriod = (typeof LeaderboardPeriod)[keyof typeof LeaderboardPeriod]

export const LeaderboardMetric = {
  Xp: 1,
  Streak: 2,
  Accuracy: 3,
  SolvedQuestions: 4,
} as const

export type LeaderboardMetric = (typeof LeaderboardMetric)[keyof typeof LeaderboardMetric]

export const DailyGoalType = {
  SolveQuestions: 1,
  CompleteQuiz: 2,
  ReviewQuestions: 3,
  ReachAccuracy: 4,
} as const

export type DailyGoalType = (typeof DailyGoalType)[keyof typeof DailyGoalType]

export const BadgeCategory = {
  Streak: 1,
  Accuracy: 2,
  Practice: 3,
  Review: 4,
  Speed: 5,
  CourseCompletion: 6,
} as const

export type BadgeCategory = (typeof BadgeCategory)[keyof typeof BadgeCategory]

export const BadgeRequirementType = {
  QuizCount: 1,
  StreakDays: 2,
  PerfectQuizCount: 3,
  LateNightStudyCount: 4,
  ReviewQuestionCount: 5,
  TotalXp: 6,
  DailyGoalCompletionCount: 7,
  TopicCompletionCount: 8,
  CourseCompletionCount: 9,
} as const

export type BadgeRequirementType = (typeof BadgeRequirementType)[keyof typeof BadgeRequirementType]

export interface GamificationProfile {
  id: string
  userId: string
  level: number
  xp: number
  totalXp: number
  currentLevelXpThreshold: number
  nextLevelXpThreshold: number
  levelProgressPercentage: number
  currentStreak: number
  longestStreak: number
  dailyGoalCompleted: boolean
  lastActivityAt: string | null
  rank: number
  unlockedBadgeCount: number
  totalBadgeCount: number
  completedDailyGoalCount: number
}

export interface UserBadge {
  badgeId: string
  name: string
  description: string
  iconUrl: string
  xpReward: number
  category: number
  requirementType: BadgeRequirementType
  isHidden: boolean
  unlocked: boolean
  unlockedAt: string | null
  progress: number
  requirementValue: number
}

export interface UnlockedBadge {
  badgeId: string
  name: string
  description: string
  iconUrl: string
  xpReward: number
  category: number
  unlockedAt: string
}

export interface Badge {
  id: string
  name: string
  description: string
  iconUrl: string
  xpReward: number
  category: BadgeCategory
  requirementType: BadgeRequirementType
  requirementValue: number
  isHidden: boolean
}

export interface UpsertBadge {
  name: string
  description: string
  iconUrl: string
  xpReward: number
  category: BadgeCategory
  requirementType: BadgeRequirementType
  requirementValue: number
  isHidden: boolean
}

export interface DailyGoal {
  userDailyGoalId: string
  dailyGoalId: string
  title: string
  description: string
  goalType: DailyGoalType
  targetValue: number
  progress: number
  completed: boolean
  completedAt: string | null
  xpReward: number
  activeDate: string
}

export interface LeaderboardEntry {
  rank: number
  userId: string
  displayName: string
  level: number
  totalXp: number
  currentStreak: number
  accuracy: number
  solvedQuestions: number
  metricValue: number
}

export interface XpTransaction {
  id: string
  amount: number
  reason: string
  referenceType: string
  referenceId: string | null
  createdAt: string
}

export interface XpHistoryResponse {
  items: XpTransaction[]
  page: number
  pageSize: number
  totalCount: number
}
