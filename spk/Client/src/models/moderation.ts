import type { ContentAccessLevel, ReviewStatus } from './enums'

export enum ModerationContentType {
  Question = 1,
  StudyNote = 2,
  SourceDocument = 3,
  TrialExam = 4,
}

export interface ModerationItem {
  contentType: ModerationContentType
  contentId: string
  title: string
  subtitle?: string | null
  reviewStatus: ReviewStatus
  accessLevel: ContentAccessLevel
  isAiGenerated: boolean
  createdAt: string
  updatedAt?: string | null
  reviewedBy?: string | null
  reviewedAt?: string | null
  reviewComment?: string | null
}

export interface ModerationHistoryItem {
  id: string
  fromStatus: ReviewStatus
  toStatus: ReviewStatus
  reviewer?: string | null
  comment?: string | null
  createdAt: string
}

export interface ModerationListResponse {
  items: ModerationItem[]
  totalCount: number
  page: number
  pageSize: number
}

export interface ModerateContentRequest {
  contentType: ModerationContentType
  contentId: string
  reviewStatus: ReviewStatus
  reviewComment?: string | null
  accessLevel?: ContentAccessLevel | null
}
