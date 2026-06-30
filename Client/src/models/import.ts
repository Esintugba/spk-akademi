import type { SourceDocument } from './sourceDocument'

export enum ImportType {
  Questions = 1,
  Materials = 2,
}

export enum ImportJobStatus {
  Pending = 0,
  Processing = 1,
  Completed = 2,
  Failed = 3,
  PartiallyCompleted = 4,
}

export enum DuplicateMatchType {
  Exact = 1,
  Similar = 2,
  PossibleDuplicate = 3,
}

export enum DuplicateImportAction {
  Skip = 1,
  Overwrite = 2,
  CreateNew = 3,
}

export interface QuestionImportRow {
  rowNumber: number
  questionText: string
  optionA?: string | null
  optionB?: string | null
  optionC?: string | null
  optionD?: string | null
  optionE?: string | null
  correctOption: string
  explanation?: string | null
  topic: string
  course: string
  difficulty?: string | null
  examYear?: number | null
  examType?: string | null
}

export interface ImportErrorItem {
  rowNumber: number
  columnName: string | null
  errorMessage: string
  rawData: string | null
}

export interface DuplicateMatch {
  rowNumber: number | null
  questionId: string | null
  matchedQuestionId: string
  matchedQuestionText: string
  similarityScore: number
  matchType: DuplicateMatchType
}

export interface DuplicateImportDecision {
  rowNumber: number
  matchedQuestionId?: string | null
  action: DuplicateImportAction
}

export interface ImportPreview {
  totalRows: number
  validRows: number
  invalidRows: number
  duplicateRows: number
  rows: QuestionImportRow[]
  errors: ImportErrorItem[]
  duplicates: DuplicateMatch[]
  missingCourses: string[]
  missingTopics: string[]
}

export interface ImportJob {
  id: string
  fileName: string
  importType: ImportType
  status: ImportJobStatus
  totalRows: number
  successfulRows: number
  failedRows: number
  startedAt: string | null
  completedAt: string | null
  createdByUserId: string
  errorReportUrl: string | null
  summary: string | null
  errors: ImportErrorItem[]
}

export interface MaterialImportPayload {
  courseId: string
  title?: string
  sourceName?: string
  file: File
}

export interface MaterialImportResult {
  totalFiles: number
  importedFiles: number
  failedFiles: number
  documents: SourceDocument[]
  errors: ImportErrorItem[]
}
