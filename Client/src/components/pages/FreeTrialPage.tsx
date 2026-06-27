import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined'
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined'
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined'
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import { Box, Button, Chip, Container, FormControlLabel, Paper, Radio, RadioGroup, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router'
import { selectIsAuthenticated } from '../../app/authSlice'
import { useAppSelector } from '../../app/hooks'
import type { QuizAttempt, QuizResult, SubmitQuizAnswer, TrialExamSummary } from '../../models'
import { api } from '../../shared/api'
import { EmptyState } from '../common/EmptyState'
import { ErrorBanner } from '../common/ErrorBanner'

const FREE_TRIAL_STORAGE_KEY = 'spk-free-trial-session'

interface StoredFreeTrialState {
  answers: Record<string, string>
  attemptId: string
  selectedExamId: string
}

export function FreeTrialPage() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const [trialExams, setTrialExams] = useState<TrialExamSummary[]>([])
  const [selectedExamId, setSelectedExamId] = useState('')
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<QuizResult | null>(null)
  const [error, setError] = useState('')
  const [isBusy, setIsBusy] = useState(false)
  const [remainingMs, setRemainingMs] = useState<number | null>(null)
  const [didTimeout, setDidTimeout] = useState(false)
  const autoSubmitTriggeredRef = useRef(false)

  const selectedExam = trialExams.find((exam) => exam.id === selectedExamId) ?? null
  const isTimedExam = Boolean(attempt?.expiresAt)
  const isLastFiveMinutes = remainingMs !== null && remainingMs <= 5 * 60 * 1000 && remainingMs > 0
  const isExpired = remainingMs !== null && remainingMs <= 0
  const isLocked = isBusy || Boolean(result) || isExpired

  const restoreAttempt = useCallback(async (storedState: StoredFreeTrialState) => {
    try {
      const activeAttempt = await api.getQuizAttempt(storedState.attemptId)

      if (activeAttempt.finishedAt) {
        clearStoredAttempt()
        return false
      }

      autoSubmitTriggeredRef.current = false
      setAttempt(activeAttempt)
      setAnswers(storedState.answers ?? {})
      setDidTimeout(activeAttempt.isExpired)
      setSelectedExamId(storedState.selectedExamId)
      return true
    } catch {
      clearStoredAttempt()
      return false
    }
  }, [])

  const restoreServerAttempt = useCallback(async () => {
    if (!isAuthenticated) {
      return false
    }

    try {
      const activeTrial = await api.getStudentActiveTrial()
      const activeAttempt = await api.getQuizAttempt(activeTrial.attemptId)

      autoSubmitTriggeredRef.current = false
      setAttempt(activeAttempt)
      setDidTimeout(activeAttempt.isExpired)
      setSelectedExamId(activeTrial.trialExamId)

      const storedState = getStoredAttempt()
      if (storedState?.attemptId === activeTrial.attemptId) {
        setAnswers(storedState.answers ?? {})
      } else {
        setAnswers({})
        storeAttempt({
          answers: {},
          attemptId: activeTrial.attemptId,
          selectedExamId: activeTrial.trialExamId,
        })
      }

      return true
    } catch {
      return false
    }
  }, [isAuthenticated])

  const loadFreeTrialExams = useCallback(async () => {
    setError('')

    try {
      const exams = await api.getFreeTrialExams()
      setTrialExams(exams)

      const storedState = isAuthenticated ? getStoredAttempt() : null
      const initialExamId = storedState?.selectedExamId || exams[0]?.id || ''
      setSelectedExamId(initialExamId)

      if (!isAuthenticated) {
        clearStoredAttempt()
        return
      }

      let restored = false
      if (storedState?.attemptId) {
        restored = await restoreAttempt(storedState)
      }

      if (!restored) {
        const restoredFromServer = await restoreServerAttempt()
        if (!restoredFromServer) {
          clearStoredAttempt()
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ücretsiz denemeler alınamadı.')
    }
  }, [isAuthenticated, restoreAttempt, restoreServerAttempt])

  const handleSubmit = useCallback(
    async (reason: 'manual' | 'timer' = 'manual') => {
      if (!attempt || isBusy || result) {
        return
      }

      setError('')
      setIsBusy(true)

      const payload: SubmitQuizAnswer[] = attempt.questions.map((question) => ({
        questionId: question.id,
        selectedOptionId: answers[question.id] || null,
      }))

      try {
        const quizResult = await api.submitQuiz(attempt.id, { answers: payload })
        setResult(quizResult)
        clearStoredAttempt()

        if (reason === 'timer') {
          setDidTimeout(true)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Cevaplar gönderilemedi.')

        if (reason === 'timer') {
          setDidTimeout(true)
        }
      } finally {
        setIsBusy(false)
      }
    },
    [answers, attempt, isBusy, result],
  )

  useEffect(() => {
    void loadFreeTrialExams()
  }, [loadFreeTrialExams])

  useEffect(() => {
    if (!attempt) {
      setRemainingMs(null)
      return
    }

    if (!attempt.expiresAt || result) {
      setRemainingMs(null)
      return
    }

    const updateRemaining = () => {
      const nextRemaining = new Date(attempt.expiresAt as string).getTime() - Date.now()
      setRemainingMs(nextRemaining)
    }

    updateRemaining()

    const timerId = window.setInterval(updateRemaining, 1000)
    return () => window.clearInterval(timerId)
  }, [attempt, result])

  useEffect(() => {
    if (!attempt || result || !attempt.expiresAt) {
      return
    }

    if (remainingMs === null) {
      return
    }

    if (remainingMs <= 1000 && !autoSubmitTriggeredRef.current) {
      autoSubmitTriggeredRef.current = true
      setDidTimeout(true)
      void handleSubmit('timer')
    }
  }, [attempt, handleSubmit, remainingMs, result])

  useEffect(() => {
    if (!attempt) {
      clearStoredAttempt()
      return
    }

    storeAttempt({
      answers,
      attemptId: attempt.id,
      selectedExamId,
    })
  }, [answers, attempt, selectedExamId])

  async function handleStart(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedExamId) {
      setError('Başlatmak için bir deneme sınavı seç.')
      return
    }

    if (!isAuthenticated) {
      setError('Ucretsiz denemeyi baslatmak icin kayit ol veya giris yap.')
      return
    }

    setError('')
    setResult(null)
    setAnswers({})
    setDidTimeout(false)
    setIsBusy(true)

    try {
      const startedAttempt = await api.startFreeTrialExam(selectedExamId)
      autoSubmitTriggeredRef.current = false
      setAttempt(startedAttempt)
      storeAttempt({
        answers: {},
        attemptId: startedAttempt.id,
        selectedExamId,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ücretsiz deneme başlatılamadı.')
    } finally {
      setIsBusy(false)
    }
  }

  const timerLabel = useMemo(() => formatRemainingTime(remainingMs), [remainingMs])

  return (
    <Box>
      <Box component="section" sx={{ bgcolor: '#0f172a', color: '#fff' }}>
        <Container maxWidth="xl" sx={{ py: { md: 7, xs: 5 } }}>
          <Stack spacing={2.5} sx={{ maxWidth: 760 }}>
            <Chip
              icon={<QuizOutlinedIcon />}
              label="Ödeme gerekmeden dene"
              sx={{ alignSelf: 'flex-start', bgcolor: 'rgba(255,255,255,0.12)', color: '#fff' }}
            />
            <Typography component="h1" sx={{ fontSize: { md: 48, xs: 34 }, fontWeight: 800 }}>
              Ücretsiz deneme sınavıyla seviyeni gör.
            </Typography>
            <Typography sx={{ color: '#cbd5e1', fontSize: { md: 19, xs: 17 }, lineHeight: 1.7 }}>
              Yayındaki ücretsiz denemelerden birini seç, soruları çöz ve sonucu anında gör.
            </Typography>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: { md: 6, xs: 4 } }}>
        {error && <ErrorBanner message={error} />}

        {!attempt && (
          <Paper component="form" onSubmit={handleStart} variant="outlined" sx={{ p: 3 }}>
            <Typography component="h2" variant="h2">
              Deneme seç
            </Typography>
            {trialExams.length === 0 ? (
              <EmptyState
                title="Yayında ücretsiz deneme yok"
                description="Admin panelinden ücretsiz ve yayında bir deneme sınavı oluşturulduğunda burada görünür."
              />
            ) : (
              <Stack spacing={2} sx={{ mt: 2 }}>
                {trialExams.map((exam) => (
                  <Paper
                    key={exam.id}
                    onClick={() => setSelectedExamId(exam.id)}
                    sx={{
                      borderColor: selectedExamId === exam.id ? 'primary.main' : 'divider',
                      cursor: 'pointer',
                      p: 2,
                    }}
                    variant="outlined"
                  >
                    <Stack direction={{ sm: 'row', xs: 'column' }} spacing={2} sx={{ justifyContent: 'space-between' }}>
                      <Box>
                        <Typography sx={{ fontWeight: 800 }}>{exam.title}</Typography>
                        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                          {exam.description}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <Chip icon={<AccessTimeOutlinedIcon />} label={`${exam.durationMinutes} dk`} />
                        <Chip icon={<CheckCircleOutlineOutlinedIcon />} label={`${exam.questionCount} soru`} />
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
                <Button
                  component={RouterLink}
                  disabled={isBusy}
                  endIcon={<ArrowForwardOutlinedIcon />}
                  to={isAuthenticated ? '/dashboard' : '/register'}
                  sx={{ alignSelf: 'flex-start' }}
                  variant="text"
                >
                  {isAuthenticated ? 'Panele dön' : 'Kayıt olarak çalışma panelini aç'}
                </Button>
                <Button
                  disabled={!isAuthenticated || isBusy}
                  sx={{ alignSelf: 'flex-start' }}
                  type="submit"
                  variant="contained"
                >
                  {isBusy ? 'Hazırlanıyor' : 'Denemeyi Başlat'}
                </Button>
              </Stack>
            )}
          </Paper>
        )}

        {attempt && (
          <Stack spacing={2.5}>
            <Paper
              sx={{
                borderColor: isLastFiveMinutes ? '#f59e0b' : 'divider',
                position: 'sticky',
                top: 88,
                zIndex: 2,
                ...(isLastFiveMinutes && {
                  animation: 'timerPulse 1.8s ease-in-out infinite',
                  '@keyframes timerPulse': {
                    '0%': { boxShadow: '0 0 0 0 rgba(245, 158, 11, 0.35)' },
                    '70%': { boxShadow: '0 0 0 10px rgba(245, 158, 11, 0)' },
                    '100%': { boxShadow: '0 0 0 0 rgba(245, 158, 11, 0)' },
                  },
                }),
              }}
              variant="outlined"
            >
              <Stack
                direction={{ md: 'row', xs: 'column' }}
                spacing={2}
                sx={{ alignItems: { md: 'center', xs: 'flex-start' }, justifyContent: 'space-between', p: 2.5 }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 800 }}>{selectedExam?.title ?? 'Aktif deneme'}</Typography>
                  <Typography color="text.secondary" variant="body2">
                    {attempt.totalQuestions} soru
                    {attempt.durationMinutes ? ` · ${attempt.durationMinutes} dakika` : ''}
                  </Typography>
                </Box>
                {isTimedExam && (
                  <Stack spacing={0.75} sx={{ minWidth: { md: 220, xs: '100%' } }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography sx={{ fontWeight: 700 }}>{isExpired ? 'Süre doldu' : 'Kalan süre'}</Typography>
                      <Chip
                        color={isLastFiveMinutes ? 'warning' : 'primary'}
                        icon={isLastFiveMinutes ? <WarningAmberRoundedIcon /> : <AccessTimeOutlinedIcon />}
                        label={timerLabel}
                      />
                    </Stack>
                    {isLastFiveMinutes && !result && (
                      <Typography color="warning.main" variant="body2">
                        Son 5 dakikadasın. Süre bitince sınav otomatik gönderilecek.
                      </Typography>
                    )}
                  </Stack>
                )}
              </Stack>
            </Paper>

            {isExpired && !result ? (
              <Paper variant="outlined" sx={{ p: 4 }}>
                <Stack spacing={1.5}>
                  <Typography sx={{ fontSize: 28, fontWeight: 800 }}>Süreniz doldu</Typography>
                  <Typography color="text.secondary">
                    Deneme sınavı süresi tamamlandı. Yeni cevap işaretleyemezsin. Otomatik gönderim başarısız olduysa
                    denemeyi yeniden başlatman gerekir.
                  </Typography>
                </Stack>
              </Paper>
            ) : (
              attempt.questions.map((question, index) => (
                <Paper key={question.id} variant="outlined" sx={{ p: 3 }}>
                  <Typography variant="h2">
                    {index + 1}. {question.text}
                  </Typography>
                  <RadioGroup
                    sx={{ mt: 2 }}
                    value={answers[question.id] || ''}
                    onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))}
                  >
                    {question.options.map((option) => (
                      <FormControlLabel
                        control={<Radio disabled={isLocked} />}
                        disabled={isLocked}
                        key={option.id}
                        label={`${option.label}) ${option.text}`}
                        value={option.id}
                      />
                    ))}
                  </RadioGroup>
                </Paper>
              ))
            )}

            {!result && !isExpired && (
              <Button disabled={isBusy} onClick={() => void handleSubmit('manual')} variant="contained">
                {isBusy ? 'Gönderiliyor' : 'Cevapları Gönder'}
              </Button>
            )}

            {result && (
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Stack spacing={1.5}>
                  <Typography sx={{ fontWeight: 800 }}>Başarı: %{result.successRate}</Typography>
                  <Typography color="text.secondary">
                    {result.correctCount} doğru, {result.wrongCount} yanlış
                  </Typography>
                  {didTimeout && (
                    <Typography color="warning.main" variant="body2">
                      Süre dolduğu için cevapların otomatik olarak gönderildi.
                    </Typography>
                  )}
                  <Button component={RouterLink} to={`/quiz/results/${attempt.id}`} variant="contained">
                    Açıklamalı çözümleri gör
                  </Button>
                </Stack>
              </Paper>
            )}
          </Stack>
        )}
      </Container>
    </Box>
  )
}

function formatRemainingTime(remainingMs: number | null) {
  if (remainingMs === null) {
    return '--:--'
  }

  if (remainingMs <= 0) {
    return '00:00'
  }

  const totalSeconds = Math.floor(remainingMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function getStoredAttempt() {
  const rawValue = window.localStorage.getItem(FREE_TRIAL_STORAGE_KEY)

  if (!rawValue) {
    return null
  }

  try {
    return JSON.parse(rawValue) as StoredFreeTrialState
  } catch {
    window.localStorage.removeItem(FREE_TRIAL_STORAGE_KEY)
    return null
  }
}

function storeAttempt(state: StoredFreeTrialState) {
  window.localStorage.setItem(FREE_TRIAL_STORAGE_KEY, JSON.stringify(state))
}

function clearStoredAttempt() {
  window.localStorage.removeItem(FREE_TRIAL_STORAGE_KEY)
}
