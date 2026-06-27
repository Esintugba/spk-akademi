import type {
  ReviewSessionResponse,
  ReviewStats,
  StartReviewSessionRequest,
  SubmitReviewSessionRequest,
  SubmitReviewSessionResult,
  TodayReviewResponse,
} from '../../models/review'
import { announceUnlockedBadges } from '../../features/gamification/announceGamification'
import { request } from './client'

export const reviewApi = {
  getToday: () => request.get<TodayReviewResponse>('/api/reviews/today'),
  getStats: () => request.get<ReviewStats>('/api/reviews/stats'),
  startSession: (payload: StartReviewSessionRequest = { maxQuestions: 20 }) =>
    request.post<ReviewSessionResponse>('/api/reviews/start', payload),
  submitSession: async (payload: SubmitReviewSessionRequest) => {
    const result = await request.post<SubmitReviewSessionResult>('/api/reviews/submit', payload)
    announceUnlockedBadges(result.unlockedBadges)
    return result
  },
}
