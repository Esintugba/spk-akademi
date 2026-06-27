import {
  Alert,
  Box,
  Button,
  Chip,
  FormControlLabel,
  LinearProgress,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { MasteryLevel } from '../../models/review'
import { QUALITY_OPTIONS, useReviewStore } from '../../stores/reviewStore'
import { ErrorBanner } from '../../components/common/ErrorBanner'
import { useSubmitReviewSession } from './hooks/useReviewQueries'

function masteryLabel(level: MasteryLevel) {
  switch (level) {
    case MasteryLevel.Mastered:
      return 'Uzman'
    case MasteryLevel.Advanced:
      return 'İleri'
    case MasteryLevel.Intermediate:
      return 'Orta'
    default:
      return 'Başlangıç'
  }
}

export function ReviewSessionPage() {
  const { sessionId = '' } = useParams()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  const activeSession = useReviewStore((s) => s.activeSession)
  const currentIndex = useReviewStore((s) => s.currentIndex)
  const answerStates = useReviewStore((s) => s.answerStates)
  const pendingAnswers = useReviewStore((s) => s.pendingAnswers)
  const setSelectedOption = useReviewStore((s) => s.setSelectedOption)
  const setQuality = useReviewStore((s) => s.setQuality)
  const commitCurrentAnswer = useReviewStore((s) => s.commitCurrentAnswer)

  const session = useMemo(() => {
    if (!activeSession || activeSession.sessionId !== sessionId) {
      return null
    }
    return activeSession
  }, [activeSession, sessionId])

  const currentQuestion = session?.questions[Math.min(currentIndex, (session?.questions.length ?? 1) - 1)]
  const isComplete = session ? currentIndex >= session.questions.length : false
  const progress = session
    ? Math.round((pendingAnswers.length / session.questionCount) * 100)
    : 0

  const submitMutation = useSubmitReviewSession({
    sessionId: session?.sessionId ?? sessionId,
    answers: pendingAnswers,
    onError: setError,
  })

  if (!session) {
    return (
      <Stack spacing={2}>
        <Alert severity="warning">Oturum bulunamadı. Lütfen tekrar listesinden yeni oturum başlatın.</Alert>
        <Button onClick={() => navigate('/reviews/today')} variant="contained">
          Bugün Tekrar Et
        </Button>
      </Stack>
    )
  }

  if (isComplete) {
    return (
      <Stack spacing={3}>
        <Typography sx={{ fontWeight: 800 }} variant="h5">
          Oturum özeti
        </Typography>
        <Paper sx={{ borderRadius: 3, p: 3 }} variant="outlined">
          <Typography color="text.secondary" variant="body2">
            {pendingAnswers.length} soru için performans değerlendirmesi alındı.
          </Typography>
          <LinearProgress sx={{ my: 2 }} value={100} variant="determinate" />
          {error && <ErrorBanner message={error} />}
          <Button
            disabled={submitMutation.isPending || pendingAnswers.length === 0}
            onClick={() => submitMutation.mutate()}
            variant="contained"
          >
            {submitMutation.isPending ? 'Kaydediliyor…' : 'Tekrarı Tamamla'}
          </Button>
        </Paper>
      </Stack>
    )
  }

  if (!currentQuestion) {
    return null
  }

  const answerState = answerStates[currentQuestion.questionId]
  const canContinue = answerState?.quality != null

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between' }}>
        <Typography sx={{ fontWeight: 800 }} variant="h5">
          Tekrar oturumu
        </Typography>
        <Chip label={`${currentIndex + 1} / ${session.questionCount}`} size="small" />
      </Stack>

      <LinearProgress value={progress} variant="determinate" />

      <Paper sx={{ borderRadius: 3, p: 3 }} variant="outlined">
        <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 2 }}>
          <Chip label={masteryLabel(currentQuestion.masteryLevel)} size="small" variant="outlined" />
          <Typography color="text.secondary" variant="caption">
            Bitiş: {new Date(session.expiresAt).toLocaleTimeString('tr-TR')}
          </Typography>
        </Stack>

        <Typography sx={{ fontWeight: 700, mb: 2 }} variant="body1">
          {currentQuestion.order}. {currentQuestion.questionText}
        </Typography>

        <RadioGroup
          onChange={(event) => setSelectedOption(currentQuestion.questionId, event.target.value)}
          value={answerState?.selectedOptionId ?? ''}
        >
          {currentQuestion.options.map((option) => (
            <FormControlLabel
              control={<Radio />}
              key={option.id}
              label={`${option.label}. ${option.text}`}
              value={option.id}
            />
          ))}
        </RadioGroup>

        <Box sx={{ mt: 3 }}>
          <Typography sx={{ fontWeight: 700, mb: 1.5 }} variant="subtitle2">
            Bu soruyu nasıl hatırladınız?
          </Typography>
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
            {QUALITY_OPTIONS.map((option) => (
              <Button
                key={option.quality}
                onClick={() => setQuality(currentQuestion.questionId, option.quality)}
                size="small"
                variant={answerState?.quality === option.quality ? 'contained' : 'outlined'}
              >
                {option.label}
              </Button>
            ))}
          </Stack>
        </Box>

        {error && <Box sx={{ mt: 2 }}><ErrorBanner message={error} /></Box>}

        <Stack direction="row" sx={{ justifyContent: 'flex-end', mt: 3 }}>
          <Button
            disabled={!canContinue}
            onClick={() => {
              setError('')
              commitCurrentAnswer()
            }}
            variant="contained"
          >
            {currentIndex + 1 >= session.questionCount ? 'Özete geç' : 'Sonraki soru'}
          </Button>
        </Stack>
      </Paper>
    </Stack>
  )
}
