import type { ContentAccessLevel, ReviewStatus } from './enums'

export interface StudyNote {
  id: string
  topicId: string
  title: string
  content: string
  sourceReference?: string | null
  isAiGenerated: boolean
  reviewStatus: ReviewStatus
  accessLevel: ContentAccessLevel
  reviewedBy?: string | null
  reviewedAt?: string | null
  reviewComment?: string | null
}

export interface PublicStudyNote {
  id: string
  topicId: string
  topicTitle: string
  courseId: string
  courseName: string
  licenseId: string
  licenseName: string
  title: string
  content: string
  sourceReference?: string | null
}

export interface CreateStudyNote {
  topicId: string
  title: string
  content: string
  sourceReference?: string | null
  isAiGenerated: boolean
  reviewStatus: ReviewStatus
  accessLevel: ContentAccessLevel
}

export type UpdateStudyNote = CreateStudyNote
