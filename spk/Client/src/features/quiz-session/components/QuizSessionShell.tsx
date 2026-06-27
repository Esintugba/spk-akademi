import { Button, FormControlLabel, Paper, Radio, RadioGroup, Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useRef } from 'react'
import type { ReactNode } from 'react'
import { UserQuestionTransitionPreference, type QuizAttempt } from '../../../models'
import { ErrorBanner } from '../../../components/common/ErrorBanner'
import { settingsApi } from '../../../shared/api'

interface QuizSessionShellProps {
  answers: Record<string, string>
  attempt: QuizAttempt
  description?: ReactNode
  error?: string
  headerContent?: ReactNode
  isBusy: boolean
  locked?: boolean
  onAnswerChange: (questionId: string, optionId: string) => void
  onSubmit: () => void
  submitLabel?: string
  submittingLabel?: string
  title: ReactNode
  warningContent?: ReactNode
}

export function QuizSessionShell({
  answers,
  attempt,
  description,
  error,
  headerContent,
  isBusy,
  locked = false,
  onAnswerChange,
  onSubmit,
  submitLabel = 'Testi Bitir',
  submittingLabel = 'Gönderiliyor...',
  title,
  warningContent,
}: QuizSessionShellProps) {
  const isLocked = locked || isBusy
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.get,
    staleTime: 300_000,
  })

  function handleAnswerChange(questionId: string, optionId: string) {
    onAnswerChange(questionId, optionId)

    if (settingsQuery.data?.questionTransition !== UserQuestionTransitionPreference.AfterAnswer) {
      return
    }

    const currentIndex = attempt.questions.findIndex((question) => question.id === questionId)
    const nextQuestionId = attempt.questions[currentIndex + 1]?.id
    if (nextQuestionId) {
      window.setTimeout(() => questionRefs.current[nextQuestionId]?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 160)
    }
  }

  return (
    <Stack spacing={3}>
      {headerContent ?? (
        <>
          <Typography sx={{ fontWeight: 800 }} variant="h5">
            {title}
          </Typography>
          {description && (
            <Typography color="text.secondary" variant="body2">
              {description}
            </Typography>
          )}
        </>
      )}

      {warningContent}
      {error && <ErrorBanner message={error} />}

      <Stack spacing={2}>
        {attempt.questions.map((question, index) => (
          <Paper
            key={question.id}
            ref={(element: HTMLDivElement | null) => {
              questionRefs.current[question.id] = element
            }}
            sx={{ borderRadius: 3, p: 2.5 }}
            variant="outlined"
          >
            <Typography sx={{ fontWeight: 700, mb: 1.5 }} variant="body1">
              {index + 1}. {question.text}
            </Typography>
            <RadioGroup
              onChange={(event) => handleAnswerChange(question.id, event.target.value)}
              value={answers[question.id] ?? ''}
            >
              {question.options.map((option) => (
                <FormControlLabel
                  control={<Radio disabled={isLocked} />}
                  key={option.id}
                  label={`${option.label}. ${option.text}`}
                  value={option.id}
                />
              ))}
            </RadioGroup>
          </Paper>
        ))}

        <Button disabled={isLocked} onClick={onSubmit} variant="contained">
          {isBusy ? submittingLabel : submitLabel}
        </Button>
      </Stack>
    </Stack>
  )
}
