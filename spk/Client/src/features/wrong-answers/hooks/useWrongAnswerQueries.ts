import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import type { SubmitQuizAnswer } from '../../../models'
import type { StartWrongAnswersQuizRequest, WrongAnswerQueueItem } from '../../../models/wrongAnswer'
import { coursesApi, quizzesApi, topicsApi, wrongAnswerApi } from '../../../shared/api'
import { useWrongAnswerStore } from '../../../stores/wrongAnswerStore'

export const wrongAnswerQueryKeys = {
  stats: ['wrong-answers', 'stats'] as const,
  queue: ['wrong-answers', 'queue'] as const,
  queueWithFilters: (filters: StartWrongAnswersQuizRequest & { dueOnly: boolean }) =>
    ['wrong-answers', 'queue', filters] as const,
  courses: ['wrong-answers', 'courses'] as const,
  topics: (courseId?: string | null) => ['wrong-answers', 'topics', courseId ?? 'none'] as const,
  attempt: (attemptId: string) => ['wrong-answers', 'attempt', attemptId] as const,
}

export function useWrongAnswerStats() {
  return useQuery({
    queryKey: wrongAnswerQueryKeys.stats,
    queryFn: () => wrongAnswerApi.getStats(),
  })
}

export function useWrongAnswerQueue(filters: StartWrongAnswersQuizRequest & { dueOnly: boolean }) {
  return useInfiniteQuery({
    queryKey: wrongAnswerQueryKeys.queueWithFilters(filters),
    queryFn: ({ pageParam }) =>
      wrongAnswerApi.getQueue({
        page: pageParam,
        pageSize: 15,
        dueOnly: filters.dueOnly,
        courseId: filters.courseId ?? undefined,
        topicId: filters.topicId ?? undefined,
        difficulty: filters.difficulty ?? undefined,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.page + 1 : undefined),
  })
}

export function useWrongAnswerFilterOptions(courseId?: string | null) {
  const coursesQuery = useQuery({
    queryKey: wrongAnswerQueryKeys.courses,
    queryFn: () => coursesApi.getAll(),
  })

  const topicsQuery = useQuery({
    enabled: Boolean(courseId),
    queryKey: wrongAnswerQueryKeys.topics(courseId),
    queryFn: () => topicsApi.getAll(courseId as string),
  })

  return {
    courses: coursesQuery.data ?? [],
    topics: topicsQuery.data ?? [],
    isLoading: coursesQuery.isLoading || topicsQuery.isLoading,
  }
}

export function useStartWrongAnswersQuiz({
  filters,
  onError,
}: {
  filters: StartWrongAnswersQuizRequest
  onError: (message: string) => void
}) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const setSession = useWrongAnswerStore((state) => state.setSession)

  return useMutation({
    mutationFn: () => wrongAnswerApi.startQuiz(filters),
    onSuccess: (response) => {
      onError('')
      setSession(response.attemptId)
      void queryClient.invalidateQueries({ queryKey: wrongAnswerQueryKeys.stats })
      void queryClient.invalidateQueries({ queryKey: wrongAnswerQueryKeys.queue })
      navigate(`/quiz/wrong-answers/session/${response.attemptId}`)
    },
    onError: (err: Error) => onError(err.message),
  })
}

export function useRemoveWrongAnswer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (questionId: string) => wrongAnswerApi.removeFromQueue(questionId),
    onMutate: async (questionId) => {
      await queryClient.cancelQueries({ queryKey: wrongAnswerQueryKeys.queue })
      const previous = queryClient.getQueryData(wrongAnswerQueryKeys.queue)
      queryClient.setQueriesData<{ pages: { items: WrongAnswerQueueItem[] }[] }>(
        { queryKey: wrongAnswerQueryKeys.queue },
        (old) => {
          if (!old) {
            return old
          }
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.filter((item) => item.questionId !== questionId),
            })),
          }
        },
      )
      return { previous }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: wrongAnswerQueryKeys.stats })
      void queryClient.invalidateQueries({ queryKey: wrongAnswerQueryKeys.queue })
    },
  })
}

export function useWrongAnswerAttempt(attemptId: string, onFinished: () => void) {
  return useQuery({
    enabled: Boolean(attemptId),
    queryKey: wrongAnswerQueryKeys.attempt(attemptId),
    queryFn: async () => {
      const loaded = await quizzesApi.getAttempt(attemptId)
      if (loaded.finishedAt) {
        onFinished()
      }
      return loaded
    },
  })
}

export function useSubmitWrongAnswerAttempt({
  answers,
  attemptId,
  onError,
}: {
  answers: Record<string, string>
  attemptId: string
  onError: (message: string) => void
}) {
  const navigate = useNavigate()
  const clearSession = useWrongAnswerStore((state) => state.clearSession)

  return useMutation({
    mutationFn: (questionIds: string[]) => {
      const payload: SubmitQuizAnswer[] = questionIds.map((questionId) => ({
        questionId,
        selectedOptionId: answers[questionId] || null,
      }))
      return quizzesApi.submit(attemptId, { answers: payload })
    },
    onSuccess: () => {
      clearSession()
      navigate(`/quiz/results/${attemptId}`, { replace: true })
    },
    onError: (err: Error) => {
      onError(err.message || 'Cevaplar gönderilemedi.')
    },
  })
}

