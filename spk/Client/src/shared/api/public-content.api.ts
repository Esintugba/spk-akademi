import type { PublicExampleTrial, PublicMiniQuizResult, PublicQuestion, SeoMetadata, StartPublicMiniQuiz } from '../../models'
import { request } from './client'

export const publicContentApi = {
  getQuestionBank: (params?: { accessLevel?: number; search?: string; topicId?: string }) =>
    request.get<PublicQuestion[]>('/api/public/question-bank', { params, skipAuth: true }),
  startMiniQuiz: (payload: StartPublicMiniQuiz) => request.post<PublicQuestion[]>('/api/public/mini-quiz/start', payload),
  submitMiniQuiz: (answers: { questionId: string; selectedOptionId?: string | null }[]) =>
    request.post<PublicMiniQuizResult>('/api/public/mini-quiz/submit', { answers }),
  getExampleTrials: (accessLevel?: number) =>
    request.get<PublicExampleTrial[]>('/api/public/example-trials', { params: { accessLevel }, skipAuth: true }),
  getSeo: (slug: string) => request.get<SeoMetadata>(`/api/public/seo/${slug}`, { skipAuth: true }),
}
