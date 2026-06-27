import type { AdminSupportDashboard } from './supportTicket'

export interface AdminDashboard {
  stats: AdminDashboardStats
  pendingActions: PendingActions
  expiringAccesses: ExpiringAccess[]
  recentUsers: RecentUser[]
  recentMessages: RecentMessage[]
  moderationQueue: ModerationQueue
  contentStats: ContentOperation
  userActivity: UserActivity
  licenseAccess: LicenseStudentCount[]
  systemHealth: SystemHealth
  supportTickets: AdminSupportDashboard
  criticalAlerts: CriticalAlert[]
}

export interface AdminDashboardStats {
  totalUsers: number
  activeStudents: number
  activeLicenses: number
  totalQuestions: number
  totalTrialExams: number
  todayActiveUsers: number
  thisWeekNewUsers: number
}

export interface PendingActions {
  pendingAccessRequests: number
  pendingContentReviews: number
  expiredAccessesToday: number
  failedImports: number
  unreadMessages: number
}

export interface RecentUser {
  id: string
  displayName: string
  email: string
  createdAt: string
}

export interface ExpiringAccess {
  id: string
  userId: string
  userEmail: string
  licenseName: string
  expiresAt: string
  isExpired: boolean
}

export interface RecentMessage {
  id: string
  subject: string
  senderName: string
  senderEmail: string
  createdAt: string
}

export interface ModerationQueue {
  pendingQuestions: number
  pendingStudyNotes: number
  pendingMaterials: number
  pendingTrialExams: number
  draftBlogPosts: number
  missingSeoMetadata: number
}

export interface ContentOperation {
  questionsAddedThisWeek: number
  trialExamsAddedThisWeek: number
  materialsAddedThisWeek: number
  approvedQuestions: number
  publishedTrialExams: number
}

export interface UserActivity {
  todayLoggedInUsers: number
  activeUsersToday: number
  questionsSolvedToday: number
  trialsCompletedToday: number
}

export interface LicenseStudentCount {
  licenseId: string
  licenseName: string
  activeStudentCount: number
}

export interface SystemHealth {
  apiStatus: string
  backgroundJobsQueued: number
  mailQueuePending: number
  importQueuePending: number
  queues: BackgroundQueueStatus[]
  checkedAt: string
}

export interface BackgroundQueueStatus {
  name: string
  capacity: number
  pendingCount: number
  enqueuedCount: number
  processedCount: number
  failedCount: number
  usagePercent: number
  averageProcessingMilliseconds: number
  oldestPendingAt?: string | null
}

export interface CriticalAlert {
  severity: 'error' | 'warning' | 'info' | string
  title: string
  description: string
  targetPath: string
}
