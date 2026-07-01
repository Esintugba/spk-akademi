import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import { Alert, Box, Button, Chip, Skeleton, Stack, Typography } from '@mui/material'
import { useNavigate, useParams } from 'react-router'
import type { QuizAttempt, SubmitQuizAnswer } from '../../models'
import { api } from '../../shared/api'
import { useQuizTrialStore } from '../../stores/quizTrialStore'
import { QuizSessionShell } from '../quiz-session/components/QuizSessionShell'

function formatRemainingTime(remainingMs: number | null) {
  if (remainingMs === null) {
    return '--:--'
  }

  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export function TrialExamSessionPage() {
  const { attemptId = '' } = useParams()
  const navigate = useNavigate()
  const { answers, setAnswer, clearSession } = useQuizTrialStore()
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null)
  const [error, setError] = useState('')
  const [isBusy, setIsBusy] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [remainingMs, setRemainingMs] = useState<number | null>(null)
  const autoSubmitTriggeredRef = useRef(false)

  const isExpired = remainingMs !== null && remainingMs <= 0
  const isLastFiveMinutes = remainingMs !== null && remainingMs <= 5 * 60 * 1000 && remainingMs > 0
  const timerLabel = useMemo(() => formatRemainingTime(remainingMs), [remainingMs])

  const loadAttempt = useCallback(async () => {
    if (!attemptId) {
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const loaded = await api.getQuizAttempt(attemptId)

      if (loaded.finishedAt) {
        navigate(`/trials/${loaded.id}`, { replace: true })
        return
      }

      setAttempt(loaded)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deneme oturumu yüklenemedi.')
    } finally {
      setIsLoading(false)
    }
  }, [attemptId, navigate])

  useEffect(() => {
    void loadAttempt()
  }, [loadAttempt])

  const handleSubmit = useCallback(
    async (reason: 'manual' | 'timer' = 'manual') => {
      if (!attempt || isBusy) {
        return
      }

      setIsBusy(true)
      setError('')

      const payload: SubmitQuizAnswer[] = attempt.questions.map((question) => ({
        questionId: question.id,
        selectedOptionId: answers[question.id] || null,
      }))

      try {
        await api.submitQuiz(attempt.id, { answers: payload })
        clearSession()
        navigate(`/quiz/results/${attempt.id}`, { replace: true })
        if (reason === 'timer') {
          setError('Süre doldu. Cevaplar otomatik gönderildi.')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Cevaplar gönderilemedi.')
      } finally {
        setIsBusy(false)
      }
    },
    [answers, attempt, clearSession, isBusy, navigate],
  )

  useEffect(() => {
    if (!attempt?.expiresAt) {
      setRemainingMs(null)
      return
    }

    const updateRemaining = () => {
      setRemainingMs(new Date(attempt.expiresAt as string).getTime() - Date.now())
    }

    updateRemaining()
    const timerId = window.setInterval(updateRemaining, 1000)
    return () => window.clearInterval(timerId)
  }, [attempt])

  useEffect(() => {
    if (!attempt || !attempt.expiresAt || remainingMs === null) {
      return
    }

    if (remainingMs <= 1000 && !autoSubmitTriggeredRef.current) {
      autoSubmitTriggeredRef.current = true
      void handleSubmit('timer')
    }
  }, [attempt, handleSubmit, remainingMs])

  if (isLoading) {
    return <Skeleton height={420} variant="rounded" />
  }

  if (!attempt) {
    return (
      <Stack spacing={2}>
        <Alert severity="error">{error || 'Oturum bulunamadı.'}</Alert>
        <Button onClick={() => navigate('/my-trials')} variant="contained">
          Denemelerime dön
        </Button>
      </Stack>
    )
  }

  return (
    <QuizSessionShell
      answers={answers}
      attempt={attempt}
      error={error}
      headerContent={
        <Stack
          direction={{ sm: 'row', xs: 'column' }}
          spacing={2}
          sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
        >
          <Box>
            <Typography sx={{ fontWeight: 800 }} variant="h5">
              Deneme oturumu
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {attempt.totalQuestions} soru
            </Typography>
          </Box>
          {attempt.expiresAt && (
            <Chip
              color={isLastFiveMinutes ? 'warning' : 'default'}
              icon={<AccessTimeOutlinedIcon />}
              label={`Kalan: ${timerLabel}`}
              sx={{ fontWeight: 700 }}
            />
          )}
        </Stack>
      }
      isBusy={isBusy}
      locked={isExpired}
      onAnswerChange={setAnswer}
      onSubmit={() => void handleSubmit('manual')}
      submitLabel="Denemeyi Bitir"
      title="Deneme oturumu"
      warningContent={
        isLastFiveMinutes ? (
          <Alert icon={<WarningAmberRoundedIcon />} severity="warning">
            Son 5 dakika. Süre dolduğunda cevaplar otomatik olarak gönderilecektir.
          </Alert>
        ) : null
      }
    />
  )
}
