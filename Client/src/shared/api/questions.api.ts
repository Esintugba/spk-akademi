import type { CreateQuestion, PastExamAnalytics, PastExamQuestionListResponse, Question, UpdateQuestion } from '../../models'
import { request } from './client'

export const questionsApi = {
  getAll: (topicId?: string) => request.get<Question[]>('/api/questions', { params: { topicId } }),
  getByReviewStatus: (reviewStatus?: number, topicId?: string) =>
    request.get<Question[]>('/api/questions', { params: { reviewStatus, topicId } }),
  getById: (id: string) => request.get<Question>(`/api/questions/${id}`),
  create: (payload: CreateQuestion) => request.post<Question>('/api/questions', payload),
  update: (id: string, payload: UpdateQuestion) => request.put<void>(`/api/questions/${id}`, payload),
  delete: (id: string) => request.delete<void>(`/api/questions/${id}`),
  getPastExamQuestions: (params: {
    examTypes?: string
    years?: string
    session?: string
    topicIds?: string
    difficulty?: number
    search?: string
    page?: number
    pageSize?: number
  }) => request.get<PastExamQuestionListResponse>('/api/questions/past-exams', { params }),
  getPastExamAnalytics: () => request.get<PastExamAnalytics>('/api/analytics/past-exams'),
}
