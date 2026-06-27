import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import type { QuizCatalogFilters } from '../../../models/quizCatalog'
import { quizCatalogApi, trialQuizApi } from '../../../shared/api'
import { useQuizTrialStore } from '../../../stores/quizTrialStore'

export const quizCatalogQueryKeys = {
  all: ['quiz-catalog'] as const,
  list: (filters: QuizCatalogFilters, licenseId?: string) => ['quiz-catalog', licenseId ?? 'student', filters] as const,
  featured: ['quiz-catalog', 'featured'] as const,
  recommended: ['quiz-catalog', 'recommended'] as const,
  overview: (quizId?: string) => ['quiz-overview', quizId] as const,
}

const pageSize = 20

export function useQuizCatalog(filters: QuizCatalogFilters, licenseId?: string) {
  return useInfiniteQuery({
    queryKey: quizCatalogQueryKeys.list(filters, licenseId),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      licenseId
        ? quizCatalogApi.getLicenseQuizzes(licenseId, { ...filters, page: pageParam, pageSize })
        : quizCatalogApi.getStudentQuizzes({ ...filters, page: pageParam, pageSize }),
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.page + 1 : undefined),
    staleTime: 60_000,
  })
}

export function useFeaturedQuizzes() {
  return useQuery({
    queryKey: quizCatalogQueryKeys.featured,
    queryFn: quizCatalogApi.getFeatured,
    staleTime: 300_000,
  })
}

export function useRecommendedQuizzes() {
  return useQuery({
    queryKey: quizCatalogQueryKeys.recommended,
    queryFn: quizCatalogApi.getRecommended,
    staleTime: 300_000,
  })
}

export function useQuizOverview(quizId?: string) {
  return useQuery({
    enabled: Boolean(quizId),
    queryKey: quizCatalogQueryKeys.overview(quizId),
    queryFn: () => quizCatalogApi.getOverview(quizId as string),
  })
}

export function useStartLicensedQuiz(onSettled?: () => void) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const setSession = useQuizTrialStore((state) => state.setSession)

  return useMutation({
    mutationFn: (quizId: string) => trialQuizApi.startLicensedTrial({ quizId }),
    onSuccess: (response) => {
      setSession(response.attemptId, response.quizId)
      void queryClient.invalidateQueries({ queryKey: quizCatalogQueryKeys.all })
      navigate(`/quiz/session/${response.attemptId}`)
    },
    onSettled,
  })
}

