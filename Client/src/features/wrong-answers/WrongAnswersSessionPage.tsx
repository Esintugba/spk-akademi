import { useState } from 'react'
import { Alert, Button, Skeleton, Stack } from '@mui/material'
import { useNavigate, useParams } from 'react-router'
import { useWrongAnswerStore } from '../../stores/wrongAnswerStore'
import { QuizSessionShell } from '../quiz-session/components/QuizSessionShell'
import { useSubmitWrongAnswerAttempt, useWrongAnswerAttempt } from './hooks/useWrongAnswerQueries'

export function WrongAnswersSessionPage() {
  const { attemptId = '' } = useParams()
  const navigate = useNavigate()
  const { answers, setAnswer } = useWrongAnswerStore()
  const [error, setError] = useState('')
  const attemptQuery = useWrongAnswerAttempt(attemptId, () => navigate('/quiz/wrong-answers', { replace: true }))
  const attempt = attemptQuery.data ?? null
  const submitMutation = useSubmitWrongAnswerAttempt({
    attemptId,
    answers,
    onError: setError,
  })

  function handleSubmit() {
    if (!attempt || submitMutation.isPending) {
      return
    }

    setError('')
    submitMutation.mutate(attempt.questions.map((question) => question.id))
  }

  if (attemptQuery.isLoading) {
    return <Skeleton height={420} variant="rounded" />
  }

  if (!attempt) {
    return (
      <Stack spacing={2}>
        <Alert severity="error">
          {error || (attemptQuery.error instanceof Error ? attemptQuery.error.message : 'Oturum bulunamadı.')}
        </Alert>
        <Button onClick={() => navigate('/quiz/wrong-answers')} variant="contained">
          Yanlışlarıma dön
        </Button>
      </Stack>
    )
  }

  return (
    <QuizSessionShell
      answers={answers}
      attempt={attempt}
      description={`${attempt.totalQuestions} soru - doğru cevapladıkça aralıklı tekrar süren uzar.`}
      error={error}
      isBusy={submitMutation.isPending}
      onAnswerChange={setAnswer}
      onSubmit={handleSubmit}
      title="Yanlışlarım tekrar testi"
    />
  )
}
