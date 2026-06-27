import type { QuestionDifficulty, QuestionType, QuizMode, StudyStatus } from './enums'
import type { ProgressTimelinePoint } from './progress'
import type { SourceDocument } from './sourceDocument'
import type { StudyNote } from './studyNote'
import type { TopicType } from './topic'

export interface StudentProgram {
  licenses: StudentProgramLicense[]
  continueLearning?: StudentContinueLearning | null
  continueTrial?: StudentContinueTrial | null
  upcomingGoals: StudentUpcomingGoal[]
}

export interface StudentProgramLicense {
  licenseId: string
  licenseName: string
  hasAccess: boolean
  progressPercentage: number
  completedCourseCount: number
  totalCourseCount: number
  lastStudiedCourseName?: string | null
  lastActivityAt?: string | null
}

export interface StudentContinueLearning {
  licenseId: string
  licenseName: string
  courseId: string
  courseName: string
  topicId: string
  topicTitle: string
  lastStudiedAt?: string | null
}

export interface StudentContinueTrial {
  attemptId: string
  trialExamId: string
  trialTitle: string
  questionCount: number
  durationMinutes?: number | null
  startedAt: string
  expiresAt?: string | null
}

export interface StudentUpcomingGoal {
  topicId: string
  courseId: string
  courseName: string
  topicTitle: string
  nextReviewAt?: string | null
  status: StudyStatus
}

export interface TopicStudyPageData {
  topicId: string
  courseId: string
  licenseId: string
  licenseName: string
  courseName: string
  topicTitle: string
  type: TopicType
  summary?: string | null
  importantPoints?: string | null
  commonMistakes?: string | null
  formulas?: string | null
  status: StudyStatus
  correctCount: number
  wrongCount: number
  successRate: number
  lastStudiedAt?: string | null
  nextReviewAt?: string | null
  isCompleted: boolean
  video: StudentTopicVideoPlaceholder
  notes: StudyNote[]
  sourceDocuments: SourceDocument[]
  relatedQuestions: TopicQuestionPreview[]
  subTopics: TopicStudySubTopic[]
}

export interface TopicStudySubTopic {
  topicId: string
  title: string
  summary?: string | null
  questionCount: number
  status: StudyStatus
  correctCount: number
  wrongCount: number
  successRate: number
  isCompleted: boolean
}

export interface StudentTopicVideoPlaceholder {
  isAvailable: boolean
  title: string
  description: string
}

export interface TopicQuestionPreview {
  questionId: string
  text: string
  difficulty: QuestionDifficulty
  type: QuestionType
}

export interface StudentAnalytics {
  successRate: number
  totalSolvedQuestions: number
  totalSolvedQuizzes: number
  todaySolvedQuestions: number
  weeklySolvedQuestions: number
  estimatedDailyStudyMinutes: number
  estimatedWeeklyStudyMinutes: number
  strongTopics: AnalyticsTopicStrength[]
  weakTopics: AnalyticsTopicStrength[]
  dailyTrend: ProgressTimelinePoint[]
  weeklyTrend: ProgressTimelinePoint[]
  trialPerformances: StudentTrialPerformance[]
}

export interface AnalyticsTopicStrength {
  topicId: string
  courseId: string
  courseName: string
  topicTitle: string
  status: StudyStatus
  correctCount: number
  wrongCount: number
  successRate: number
  lastStudiedAt?: string | null
}

export interface StudentTrialPerformance {
  attemptId: string
  trialExamId: string
  trialTitle: string
  correctCount: number
  wrongCount: number
  totalQuestions: number
  successRate: number
  durationMinutes?: number | null
  usedMinutes: number
  finishedAt: string
}

export interface TrialAttemptSummary {
  attemptId: string
  trialExamId: string
  trialTitle: string
  correctCount: number
  wrongCount: number
  totalQuestions: number
  successRate: number
  durationMinutes?: number | null
  usedMinutes: number
  startedAt: string
  finishedAt?: string | null
  isCompleted: boolean
}

export interface QuizResultHistoryItem {
  attemptId: string
  title: string
  mode: QuizMode
  courseId?: string | null
  courseName?: string | null
  topicId?: string | null
  topicName?: string | null
  correctCount: number
  wrongCount: number
  emptyCount: number
  totalQuestions: number
  successRate: number
  durationSeconds: number
  startedAt: string
  finishedAt: string
}

export interface TrialAttemptDetail {
  attemptId: string
  trialExamId: string
  trialTitle: string
  correctCount: number
  wrongCount: number
  totalQuestions: number
  successRate: number
  durationMinutes?: number | null
  usedMinutes: number
  startedAt: string
  finishedAt?: string | null
  answers: TrialAttemptAnswer[]
}

export interface TrialAttemptAnswer {
  questionId: string
  questionText: string
  selectedOptionId?: string | null
  correctOptionId: string
  isCorrect: boolean
  explanation: string
}

export interface AccountProfile {
  email: string
  displayName: string
  role: 'Admin' | 'Student'
}

export interface UpdateAccountProfile {
  displayName: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}
