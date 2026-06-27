import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { toast } from 'react-toastify'
import { QuizMode } from '../models/enums'
import { QuizAttemptStatus } from '../models/quizSession'
import { quizSessionApi } from '../shared/api'

export function useQuizSessionNavigate() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const resolveMutation = useMutation({
    mutationFn: (attemptId: string) => quizSessionApi.getSession(attemptId),
    onSuccess: (session) => {
      queryClient.setQueryData(['quiz-sessions', 'session', session.attemptId], session)

      if (!session.canResume) {
        if (session.status === QuizAttemptStatus.Completed) {
          toast.info('Bu oturum tamamlanmış.')
          if (session.quizMode !== QuizMode.ReviewSession) {
            navigate(`/quiz/results/${session.attemptId}`, { replace: true })
          }
          return
        }

        if (session.status === QuizAttemptStatus.Expired) {
          toast.error('Oturum süresi dolmuş.')
          return
        }
      }

      navigate(session.route, { replace: true })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Oturum bilgisi alınamadı.')
    },
  })

  function goToSession(attemptId: string) {
    if (!attemptId) {
      return
    }

    resolveMutation.mutate(attemptId)
  }

  return {
    goToSession,
    isResolving: resolveMutation.isPending,
  }
}
