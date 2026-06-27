import type { StudyStatus } from './enums'

export interface ProgressOverview {
  activeLicenseCount: number
  totalCourseCount: number
  completedCourseCount: number
  totalTopicCount: number
  studiedTopicCount: number
  needsReviewTopicCount: number
  masteredTopicCount: number
  solvedQuizCount: number
  totalQuestionCount: number
  correctCount: number
  wrongCount: number
  successRate: number
  lastActivityAt?: string | null
  dailyGoal: ProgressDailyGoal
  recentCourses: ProgressRecentCourse[]
  recentActivities: ProgressRecentActivity[]
  upcomingReviews: ProgressUpcomingReview[]
}

export interface ProgressDailyGoal {
  targetQuestionCount: number
  completedQuestionCount: number
  completionRate: number
}

export interface ProgressRecentCourse {
  courseId: string
  licenseId: string
  licenseName: string
  courseName: string
  studiedTopicCount: number
  totalTopicCount: number
  progressPercentage: number
  lastActivityAt?: string | null
}

export interface ProgressRecentActivity {
  topicId: string
  courseId: string
  licenseId: string
  licenseName: string
  courseName: string
  topicTitle: string
  status: StudyStatus
  correctCount: number
  wrongCount: number
  successRate: number
  lastStudiedAt?: string | null
  nextReviewAt?: string | null
}

export interface ProgressUpcomingReview {
  topicId: string
  courseId: string
  courseName: string
  topicTitle: string
  nextReviewAt?: string | null
  status: StudyStatus
}

export interface LicenseProgress {
  licenseId: string
  licenseName: string
  totalCourseCount: number
  completedCourseCount: number
  totalTopicCount: number
  studiedTopicCount: number
  needsReviewTopicCount: number
  masteredTopicCount: number
  totalQuestionCount: number
  correctCount: number
  wrongCount: number
  successRate: number
  progressPercentage: number
  lastActivityAt?: string | null
}

export interface CourseProgress {
  courseId: string
  licenseId: string
  licenseName: string
  courseName: string
  totalTopicCount: number
  studiedTopicCount: number
  completedTopicCount: number
  needsReviewTopicCount: number
  masteredTopicCount: number
  totalQuestionCount: number
  correctCount: number
  wrongCount: number
  successRate: number
  progressPercentage: number
  lastActivityAt?: string | null
  topics: CourseTopicProgress[]
}

export interface CourseTopicProgress {
  topicId: string
  topicTitle: string
  order: number
  questionCount: number
  studyNoteCount: number
  sourceDocumentCount: number
  wrongAnswerQueueCount: number
  dueReviewCount: number
  status: StudyStatus
  correctCount: number
  wrongCount: number
  successRate: number
  lastStudiedAt?: string | null
  nextReviewAt?: string | null
}

export interface ProgressStatistics {
  solvedQuizCount: number
  totalQuestionCount: number
  correctCount: number
  wrongCount: number
  successRate: number
  todayQuizCount: number
  weeklyQuizCount: number
  todayQuestionCount: number
  weeklyQuestionCount: number
  dailyTimeline: ProgressTimelinePoint[]
  weeklyTimeline: ProgressTimelinePoint[]
}

export interface ProgressTimelinePoint {
  label: string
  periodStart: string
  quizCount: number
  questionCount: number
  correctCount: number
  wrongCount: number
  successRate: number
}
