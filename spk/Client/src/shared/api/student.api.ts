import type { QuizResultHistoryItem, StudentAnalytics, StudentContinueTrial, StudentProgram, TopicStudyPageData, TrialAttemptDetail, TrialAttemptSummary } from '../../models'
import { request } from './client'

export const studentApi = {
  getProgram: () => request.get<StudentProgram>('/api/student/program'),
  getTopicStudyPage: (topicId: string) => request.get<TopicStudyPageData>(`/api/student/topic-study/${topicId}`),
  markTopicCompleted: (topicId: string, isCompleted: boolean) =>
    request.post<void>(`/api/student/topic-study/${topicId}/complete`, { isCompleted }),
  getAnalytics: () => request.get<StudentAnalytics>('/api/student/analytics'),
  getTrialHistory: () => request.get<TrialAttemptSummary[]>('/api/student/trial-history'),
  getResultHistory: () => request.get<QuizResultHistoryItem[]>('/api/student/result-history'),
  getTrialHistoryDetail: (attemptId: string) => request.get<TrialAttemptDetail>(`/api/student/trial-history/${attemptId}`),
  getActiveTrial: () => request.get<StudentContinueTrial>('/api/student/trial-continue'),
}
