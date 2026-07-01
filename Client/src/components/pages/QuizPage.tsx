import { type FormEvent, useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button, Chip, FormControlLabel, MenuItem, Paper, Radio, RadioGroup, Stack, TextField, Typography } from '@mui/material'
import { Link as RouterLink, useLocation, useNavigate, useSearchParams } from 'react-router'
import { QuizMode, TopicType, UserQuestionTransitionPreference, type QuizAttempt, type SubmitQuizAnswer, type Topic } from '../../models'
import { api, settingsApi } from '../../shared/api'
import { EmptyState } from '../common/EmptyState'
import { ErrorBanner } from '../common/ErrorBanner'
import { StudentPageHero } from '../common/StudentPageHero'

interface QuizPageProps {
  topics: Topic[]
}

export function QuizPage({ topics }: QuizPageProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const isMixedEntry = location.pathname === '/mixed-practice' || searchParams.get('mode') === 'mixed'
  const [topicId, setTopicId] = useState(isMixedEntry ? '' : searchParams.get('topicId') ?? '')
  const [questionCount, setQuestionCount] = useState(10)
  const [questionCountTouched, setQuestionCountTouched] = useState(false)
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [isBusy, setIsBusy] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null)
  const autoSubmitRef = useRef(false)
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.get,
    staleTime: 300_000,
  })

  useEffect(() => {
    if (isMixedEntry) {
      setTopicId('')
    }
  }, [isMixedEntry])

  useEffect(() => {
    if (!settingsQuery.data || questionCountTouched || attempt) {
      return
    }

    setQuestionCount(settingsQuery.data.defaultQuestionCount)
  }, [attempt, questionCountTouched, settingsQuery.data])

  useEffect(() => {
    if (!attempt || remainingSeconds === null) {
      return
    }

    if (remainingSeconds <= 0) {
      if (!autoSubmitRef.current) {
        autoSubmitRef.current = true
        void handleSubmit()
      }
      return
    }

    const handle = window.setTimeout(() => {
      setRemainingSeconds((current) => (current === null ? null : Math.max(0, current - 1)))
    }, 1000)

    return () => window.clearTimeout(handle)
    // handleSubmit intentionally reads the current attempt and answers at timeout.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, remainingSeconds])

  function handleAnswerChange(questionId: string, optionId: string) {
    setAnswers((current) => ({ ...current, [questionId]: optionId }))

    if (settingsQuery.data?.questionTransition !== UserQuestionTransitionPreference.AfterAnswer || !attempt) {
      return
    }

    const currentIndex = attempt.questions.findIndex((question) => question.id === questionId)
    const nextQuestionId = attempt.questions[currentIndex + 1]?.id
    if (nextQuestionId) {
      window.setTimeout(() => questionRefs.current[nextQuestionId]?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 160)
    }
  }

  async function handleStart(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setAnswers({})
    setIsBusy(true)

    try {
      const startedAttempt = await api.startQuiz({
        mode: topicId ? QuizMode.TopicPractice : QuizMode.MixedPractice,
        topicId: topicId || null,
        courseId: null,
        questionCount,
      })
      setAttempt(startedAttempt)
      autoSubmitRef.current = false
      setRemainingSeconds(settingsQuery.data?.timedQuizDefault ? Math.max(1, settingsQuery.data.defaultQuizDurationMinutes) * 60 : null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test başlatılamadı.')
    } finally {
      setIsBusy(false)
    }
  }

  async function handleSubmit() {
    if (!attempt) {
      return
    }

    setError('')
    setIsBusy(true)

    const payload: SubmitQuizAnswer[] = attempt.questions.map((question) => ({
      questionId: question.id,
      selectedOptionId: answers[question.id] || null,
    }))

    try {
      await api.submitQuiz(attempt.id, { answers: payload })
      setRemainingSeconds(null)
      navigate(`/quiz/results/${attempt.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cevaplar gönderilemedi.')
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <section>
      <Stack spacing={3}>
        <StudentPageHero
          eyebrow="Soru Bankası"
          title={isMixedEntry ? 'Karışık Test' : 'Test Çöz'}
          description={
            isMixedEntry
              ? 'Erişimin olan içeriklerden rastgele sorularla hızlı pratik başlat.'
              : 'Ana konu, alt konu veya karışık kısa testler başlat. Tek derse odaklanmak için Ders Pratiği sayfasını kullan.'
          }
          actions={
            <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1}>
              {!isMixedEntry && (
                <Button component={RouterLink} to="/mixed-practice" variant="outlined">
                  Karışık Test
                </Button>
              )}
              <Button component={RouterLink} to="/quiz/course-practice" variant="outlined">
                Ders Bazlı Pratik
              </Button>
            </Stack>
          }
        />
        {error && <ErrorBanner message={error} />}

        <Paper component="form" onSubmit={handleStart} sx={{ borderRadius: 3, p: 3 }} variant="outlined">
          <Stack direction={{ md: 'row', xs: 'column' }} spacing={2}>
            <TextField fullWidth label="Ana konu / Alt konu" select value={topicId} onChange={(event) => setTopicId(event.target.value)}>
              <MenuItem value="">Karışık</MenuItem>
              {topics.map((topic) => (
                <MenuItem key={topic.id} value={topic.id}>
                  {topic.type === TopicType.SubTopic ? `  - ${topic.title}` : `Ana konu: ${topic.title}`}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="Soru sayısı"
              slotProps={{ htmlInput: { min: 1 } }}
              type="number"
              value={questionCount}
              onChange={(event) => {
                setQuestionCountTouched(true)
                setQuestionCount(Number(event.target.value))
              }}
            />
            <Button disabled={isBusy} type="submit" variant="contained">
              {isBusy ? 'Hazırlanıyor' : 'Test Başlat'}
            </Button>
          </Stack>
        </Paper>

        {!attempt && <EmptyState title="Aktif test yok" description="Bir konu seçip test başlatabilirsin." />}

        {attempt && (
          <Stack spacing={2}>
            {remainingSeconds !== null && (
              <Chip
                color={remainingSeconds <= 60 ? 'warning' : 'primary'}
                label={`Kalan süre: ${formatRemainingTime(remainingSeconds)}`}
                sx={{ alignSelf: 'flex-start', fontWeight: 800 }}
              />
            )}
            {attempt.questions.map((question, index) => (
              <Paper
                key={question.id}
                ref={(element: HTMLDivElement | null) => {
                  questionRefs.current[question.id] = element
                }}
                sx={{ borderRadius: 3, p: 3 }}
                variant="outlined"
              >
                <Typography variant="h2">
                  {index + 1}. {question.text}
                </Typography>
                <RadioGroup sx={{ mt: 2 }} value={answers[question.id] || ''} onChange={(event) => handleAnswerChange(question.id, event.target.value)}>
                  {question.options.map((option) => (
                    <FormControlLabel control={<Radio />} key={option.id} label={`${option.label}) ${option.text}`} value={option.id} />
                  ))}
                </RadioGroup>
              </Paper>
            ))}

            <Button disabled={isBusy} onClick={() => void handleSubmit()} variant="contained">
              {isBusy ? 'Gönderiliyor' : 'Cevapları Gönder ve Sonuçları Gör'}
            </Button>
          </Stack>
        )}
      </Stack>
    </section>
  )
}

function formatRemainingTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
