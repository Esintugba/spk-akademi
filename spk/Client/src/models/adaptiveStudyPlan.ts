export enum AdaptiveStudyTaskType {
  Review = 1,
  TopicStudy = 2,
  Quiz = 3,
  WrongAnswerAnalysis = 4,
}

export interface AdaptiveStudyTask {
  id: string
  type: AdaptiveStudyTaskType
  topicId?: string | null
  topicTitle?: string | null
  mainTopicId?: string | null
  mainTopicTitle?: string | null
  courseName?: string | null
  targetMinutes: number
  targetQuestions: number
  priority: number
  actionUrl: string
  title: string
  description: string
  completed: boolean
  completedAt?: string | null
  actualMinutes: number
  actualQuestions: number
}

export interface AdaptiveStudyRecommendation {
  topicId?: string | null
  title: string
  description: string
  priority: number
  actionUrl: string
}

export interface AdaptiveStudyRiskTopic {
  topicId: string
  topicTitle: string
  mainTopicId?: string | null
  mainTopicTitle?: string | null
  courseName: string
  priority: number
  successRate: number
  wrongCount: number
  dueReviewCount: number
}

export interface AdaptiveStudyPlan {
  id: string
  planDate: string
  estimatedMinutes: number
  completionRate: number
  generatedAt: string
  daysUntilExam: number
  estimatedTargetCompletionRate: number
  summary: string
  tasks: AdaptiveStudyTask[]
  recommendations: AdaptiveStudyRecommendation[]
  riskyTopics: AdaptiveStudyRiskTopic[]
  criticalWeeklyTasks: string[]
}

export interface CompleteAdaptiveStudyTask {
  actualMinutes?: number | null
  actualQuestions?: number | null
}
