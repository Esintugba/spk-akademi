import type { ContentAccessLevel, ReviewStatus } from './enums'

export interface SourceDocument {
  id: string
  courseId: string
  title: string
  fileName: string
  filePath: string
  sourceName: string
  sourcePublishedAt?: string | null
  sourceUpdatedAt?: string | null
  pageCount: number
  textExtractedAt?: string | null
  reviewStatus: ReviewStatus
  accessLevel: ContentAccessLevel
  reviewedBy?: string | null
  reviewedAt?: string | null
  reviewComment?: string | null
}

export interface SourceDocumentText {
  id: string
  courseId: string
  title: string
  pageCount: number
  textExtractedAt?: string | null
  extractedText: string
}
