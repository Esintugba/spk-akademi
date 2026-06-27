import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { toast } from 'react-toastify'
import type { SubmitReviewAnswer } from '../../../models/review'
import { reviewApi } from '../../../shared/api'
import { useReviewStore } from '../../../stores/reviewStore'
import { goalQueryKeys } from '../../goals/hooks/useGoals'

export const reviewQueryKeys = {
  today: ['reviews', 'today'] as const,
  stats: ['reviews', 'stats'] as const,
}

export function useTodayReviews() {
  return useQuery({
    queryKey: reviewQueryKeys.today,
    queryFn: () => reviewApi.getToday(),
  })
}

export function useReviewStats() {
  return useQuery({
    queryKey: reviewQueryKeys.stats,
    queryFn: () => reviewApi.getStats(),
  })
}

export function useStartReviewSession() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const setActiveSession = useReviewStore((s) => s.setActiveSession)

  return useMutation({
    mutationFn: () => reviewApi.startSession({ maxQuestions: 20 }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: reviewQueryKeys.today })
    },
    onSuccess: (session) => {
      setActiveSession(session)
      navigate(`/reviews/session/${session.sessionId}`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Tekrar oturumu başlatılamadı.')
    },
  })
}

export function useSubmitReviewSession({
  answers,
  onError,
  sessionId,
}: {
  answers: SubmitReviewAnswer[]
  onError: (message: string) => void
  sessionId: string
}) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const clearSession = useReviewStore((s) => s.clearSession)

  return useMutation({
    mutationFn: () =>
      reviewApi.submitSession({
        sessionId,
        answers,
      }),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: reviewQueryKeys.today })
      await queryClient.invalidateQueries({ queryKey: reviewQueryKeys.stats })
      await queryClient.invalidateQueries({ queryKey: goalQueryKeys.all })
      clearSession()
      toast.success(`Tekrar tamamlandı: ${result.correctCount}/${result.questionCount} doğru (%${result.retentionRate})`)
      navigate('/reviews/today', { replace: true })
    },
    onError: (err: Error) => {
      onError(err.message || 'Tekrar gönderilemedi.')
    },
  })
}
