import { useCallback, useEffect, useState } from 'react'
import { Alert, Button, Skeleton, Stack } from '@mui/material'
import { useNavigate, useParams } from 'react-router'
import type { QuizAttempt, SubmitQuizAnswer } from '../../models'
import { api } from '../../shared/api'
import { useCoursePracticeStore } from '../../stores/coursePracticeStore'
import { QuizSessionShell } from '../quiz-session/components/QuizSessionShell'

export function CoursePracticeSessionPage() {
  const { attemptId = '' } = useParams()
  const navigate = useNavigate()
  const { answers, setAnswer, markQuestionStart, questionStartedAt, clearSession } = useCoursePracticeStore()
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
      loaded.questions.forEach((q) => markQuestionStart(q.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test yüklenemedi.')
    } finally {
      setIsLoading(false)
    }
  }, [attemptId, markQuestionStart, navigate])

  useEffect(() => {
    void loadAttempt()
  }, [loadAttempt])

  async function handleSubmit() {
    if (!attempt || isBusy) {
      return
    }

    setIsBusy(true)
    setError('')

    const payload: SubmitQuizAnswer[] = attempt.questions.map((question) => {
      const startedAt = questionStartedAt[question.id]
      const timeSpentSeconds = startedAt
        ? Math.max(1, Math.round((Date.now() - startedAt) / 1000))
        : null

      return {
        questionId: question.id,
        selectedOptionId: answers[question.id] || null,
        timeSpentSeconds,
      }
    })

    try {
      await api.submitQuiz(attempt.id, { answers: payload })
      clearSession()
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
        <Button onClick={() => navigate('/quiz/course-practice')} variant="contained">
          Ders pratiğine dön
        </Button>
      </Stack>
    )
  }

  return (
    <QuizSessionShell
      answers={answers}
      attempt={attempt}
      description={`${attempt.totalQuestions} soru içerir. Testi tamamladıktan sonra ders ve konu bazlı analizini görüntüleyebilirsin.`}
      error={error}
      isBusy={isBusy}
      onAnswerChange={setAnswer}
      onSubmit={() => void handleSubmit()}
      submitLabel="Testi Bitir ve Sonuçları Gör"
      title="Ders bazlı pratik test"
    />
  )
}
