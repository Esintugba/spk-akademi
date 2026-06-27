import type { StudyStatus } from './enums'

export interface StudyProgress {
  id: string
  topicId: string
  status: StudyStatus
  correctCount: number
  wrongCount: number
  lastStudiedAt?: string | null
  nextReviewAt?: string | null
}
