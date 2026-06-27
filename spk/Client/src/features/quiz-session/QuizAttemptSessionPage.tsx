import { useCallback, useEffect, useState } from 'react'
import { Alert, Button, Skeleton, Stack } from '@mui/material'
import { useNavigate, useParams } from 'react-router'
import type { QuizAttempt, SubmitQuizAnswer } from '../../models'
import { api } from '../../shared/api'
import { QuizSessionShell } from './components/QuizSessionShell'

export function QuizAttemptSessionPage({ title = 'Quiz oturumu' }: { title?: string }) {
  const { attemptId = '' } = useParams()
  const navigate = useNavigate()
  const [localAnswers, setLocalAnswers] = useState<Record<string, string>>({})
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null)
  const [error, setError] = useState('')
  const [isBusy, setIsBusy] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const loadAttempt = useCallback(async () => {
    if (!attemptId) {
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const loaded = await api.getQuizAttempt(attemptId)
      if (loaded.finishedAt) {
        navigate(`/quiz/results/${loaded.id}`, { replace: true })
        return
      }
      setAttempt(loaded)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Oturum yüklenemedi.')
    } finally {
      setIsLoading(false)
    }
  }, [attemptId, navigate])

  useEffect(() => {
    void loadAttempt()
  }, [loadAttempt])

  async function handleSubmit() {
    if (!attempt || isBusy) {
      return
    }

    setIsBusy(true)
    setError('')

    const payload: SubmitQuizAnswer[] = attempt.questions.map((question) => ({
      questionId: question.id,
      selectedOptionId: localAnswers[question.id] || null,
    }))

    try {
      await api.submitQuiz(attempt.id, { answers: payload })
      navigate(`/quiz/results/${attempt.id}`, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cevaplar gönderilemedi.')
    } finally {
      setIsBusy(false)
    }
  }

  if (isLoading) {
    return <Skeleton height={420} variant="rounded" />
  }

  if (!attempt) {
    return (
      <Stack spacing={2}>
        <Alert severity="error">{error || 'Oturum bulunamadı.'}</Alert>
        <Button onClick={() => navigate('/dashboard')} variant="contained">
          Panele dön
        </Button>
      </Stack>
    )
  }

  return (
    <QuizSessionShell
      answers={localAnswers}
      attempt={attempt}
      error={error}
      isBusy={isBusy}
      onAnswerChange={(questionId, optionId) => setLocalAnswers((prev) => ({ ...prev, [questionId]: optionId }))}
      onSubmit={() => void handleSubmit()}
      title={title}
    />
  )
}
