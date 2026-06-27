import type { CreateTrialExam, TrialExamDetail, TrialExamSummary, UpdateTrialExam } from '../../models'
import { request } from './client'

export const trialExamsApi = {
  getAll: () => request.get<TrialExamSummary[]>('/api/trial-exams'),
  getFree: () => request.get<TrialExamSummary[]>('/api/trial-exams/free'),
  getById: (id: string) => request.get<TrialExamDetail>(`/api/trial-exams/${id}`),
  create: (payload: CreateTrialExam) => request.post<TrialExamDetail>('/api/trial-exams', payload),
  update: (id: string, payload: UpdateTrialExam) => request.put<void>(`/api/trial-exams/${id}`, payload),
  delete: (id: string) => request.delete<void>(`/api/trial-exams/${id}`),
}
