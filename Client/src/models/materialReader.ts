import type { MaterialHighlightColor } from './materialReaderEnums'

export interface MaterialViewer {
  materialId: string
  title: string
  pageCount: number
  streamUrl: string
  resumePage?: number | null
  progressPercentage?: number | null
  watermarkText?: string | null
}

export interface MaterialProgressRequest {
  materialId: string
  lastPage: number
  progressPercentage: number
  secondsReadDelta?: number | null
}

export interface MaterialBookmark {
  id: string
  materialId: string
  pageNumber: number
  title: string
  createdAt: string
}

export interface CreateMaterialBookmark {
  pageNumber: number
  title: string
}

export interface MaterialNote {
  id: string
  materialId: string
  pageNumber: number
  selectedText?: string | null
  note: string
  highlightColor: MaterialHighlightColor
  isFavorite: boolean
  folderName?: string | null
  tags: string[]
  isInReview: boolean
  reviewRepetition: number
  reviewIntervalDays: number
  nextReviewAt?: string | null
  createdAt: string
  updatedAt?: string | null
}

export interface MyMaterialNote extends MaterialNote {
  materialTitle: string
  courseId: string
  courseName: string
}

export interface CreateMaterialNote {
  pageNumber: number
  selectedText?: string | null
  note: string
  highlightColor: MaterialHighlightColor
  folderName?: string | null
  tags?: string[]
}

export interface UpdateMaterialNote {
  note?: string | null
  highlightColor?: MaterialHighlightColor | null
  isFavorite?: boolean | null
  folderName?: string | null
  tags?: string[] | null
  isInReview?: boolean | null
}

export interface ReviewMaterialNote {
  id: string
  materialId: string
  materialTitle: string
  pageNumber: number
  prompt: string
  answer: string
  folderName?: string | null
  tags: string[]
  repetition: number
  intervalDays: number
  nextReviewAt?: string | null
}

export interface MaterialNoteReviewResult {
  noteId: string
  repetition: number
  intervalDays: number
  nextReviewAt: string
}

export interface ReadingHistoryItem {
  materialId: string
  title: string
  lastPage: number
  progressPercentage: number
  lastOpenedAt: string
  completedAt?: string | null
  totalSecondsRead: number
}

export interface MaterialLibraryItem {
  materialId: string
  courseId: string
  courseName: string
  title: string
  sourceName: string
  pageCount: number
  lastOpenedAt?: string | null
  lastPage?: number | null
  progressPercentage?: number | null
}

export interface ReadingAnalytics {
  totalSecondsRead: number
  completedMaterialCount: number
  activeMaterialCount: number
  topMaterialsByNotes: { materialId: string; title: string; noteCount: number }[]
  dailyReadSeconds: { date: string; secondsRead: number }[]
}

