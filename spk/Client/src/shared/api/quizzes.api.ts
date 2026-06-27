import type {
  PastExamQuizStartResponse,
  QuizAttempt,
  QuizResult,
  StartPastExamQuizRequest,
  StartQuiz,
  SubmitQuiz,
} from '../../models'
import type {
  FeaturedQuiz,
  QuizCatalogFilters,
  QuizCatalogResponse,
  QuizOverview,
} from '../../models/quizCatalog'
import type {
  CoursePracticeCourseOption,
  CoursePracticeQuizStartResponse,
  StartCoursePracticeQuizRequest,
} from '../../models/coursePractice'
import type { QuizResultDetail } from '../../models/quizResult'
import type { ActiveQuizSession, QuizSession } from '../../models/quizSession'
import type {
  QuizAttemptStartResponse,
  StartLicensedQuizRequest,
  StudentAccessibleTrial,
} from '../../models/trialQuiz'
import type {
  StartWrongAnswersQuizRequest,
  WrongAnswerQueuePage,
  WrongAnswerStats,
  WrongAnswersQuizStartResponse,
} from '../../models/wrongAnswer'
import { announceUnlockedBadges } from '../../features/gamification/announceGamification'
import { request } from './client'

export interface QuizResultDetailParams {
  page?: number
  pageSize?: number
  includeExplanations?: boolean
}

export interface WrongAnswerQueueParams {
  page?: number
  pageSize?: number
  dueOnly?: boolean
  courseId?: string
  topicId?: string
  difficulty?: number
}

function cleanParams(filters?: QuizCatalogFilters & { page?: number; pageSize?: number }) {
  if (!filters) {
    return undefined
  }

  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  )
}

export const quizzesApi = {
  start: (payload: StartQuiz) => request.post<QuizAttempt>('/api/quizzes/start', payload),
  getAttempt: (attemptId: string) => request.get<QuizAttempt>(`/api/quizzes/${attemptId}`),
  submit: async (attemptId: string, payload: SubmitQuiz) => {
    const result = await request.post<QuizResult>(`/api/quizzes/${attemptId}/submit`, payload)
    announceUnlockedBadges(result.unlockedBadges)
    return result
  },

  startFreeTrialExam: (trialExamId: string) =>
    request.post<QuizAttempt>('/api/quizzes/free-trial/start', { trialExamId }),
  getMyTrials: () => request.get<StudentAccessibleTrial[]>('/api/student/my-trials'),
  startLicensedTrial: (payload: StartLicensedQuizRequest) =>
    request.post<QuizAttemptStartResponse>('/api/quizzes/trial/start', payload),

  getStudentQuizzes: (filters?: QuizCatalogFilters & { page?: number; pageSize?: number }) =>
    request.get<QuizCatalogResponse>('/api/student/quizzes', { params: cleanParams(filters) }),
  getLicenseQuizzes: (licenseId: string, filters?: QuizCatalogFilters & { page?: number; pageSize?: number }) =>
    request.get<QuizCatalogResponse>(`/api/licenses/${licenseId}/quizzes`, {
      params: cleanParams(filters),
    }),
  getOverview: (quizId: string) => request.get<QuizOverview>(`/api/quizzes/${quizId}/overview`),
  getFeatured: () => request.get<FeaturedQuiz[]>('/api/quizzes/featured'),
  getRecommended: () => request.get<FeaturedQuiz[]>('/api/student/quizzes/recommended'),

  getResultDetail: (attemptId: string, params?: QuizResultDetailParams) =>
    request.get<QuizResultDetail>(`/api/quizzes/results/${attemptId}`, { params }),

  getSession: (attemptId: string) => request.get<QuizSession>(`/api/quizzes/session/${attemptId}`),
  getActiveSessions: () => request.get<ActiveQuizSession[]>('/api/quizzes/active'),

  startPastExam: (payload: StartPastExamQuizRequest) =>
    request.post<PastExamQuizStartResponse>('/api/quizzes/past-exams/start', payload),

  getWrongAnswerStats: () => request.get<WrongAnswerStats>('/api/quizzes/wrong-answers/stats'),
  getWrongAnswerQueue: (params?: WrongAnswerQueueParams) =>
    request.get<WrongAnswerQueuePage>('/api/quizzes/wrong-answers/queue', { params }),
  startWrongAnswersQuiz: (payload: StartWrongAnswersQuizRequest) =>
    request.post<WrongAnswersQuizStartResponse>('/api/quizzes/wrong-answers/start', payload),
  removeWrongAnswerFromQueue: (questionId: string) =>
    request.delete<{ questionId: string; removed: boolean }>(`/api/quizzes/wrong-answers/${questionId}`),

  getCoursePracticeCourses: () =>
    request.get<CoursePracticeCourseOption[]>('/api/quizzes/course-practice/courses'),
  startCoursePractice: (payload: StartCoursePracticeQuizRequest) =>
    request.post<CoursePracticeQuizStartResponse>('/api/quizzes/course-practice/start', payload),
}
