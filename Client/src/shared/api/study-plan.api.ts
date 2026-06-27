import type { AdaptiveStudyPlan, AdaptiveStudyRecommendation, CompleteAdaptiveStudyTask } from '../../models'
import { request } from './client'

export const studyPlanApi = {
  getToday: () => request.get<AdaptiveStudyPlan>('/api/study-plan/today'),
  getWeek: () => request.get<AdaptiveStudyPlan[]>('/api/study-plan/week'),
  regenerate: () => request.post<AdaptiveStudyPlan>('/api/study-plan/regenerate'),
  completeTask: (taskId: string, payload: CompleteAdaptiveStudyTask = {}) =>
    request.post<AdaptiveStudyPlan>(`/api/study-plan/tasks/${taskId}/complete`, payload),
  getRecommendations: () => request.get<AdaptiveStudyRecommendation[]>('/api/study-plan/recommendations'),
}
