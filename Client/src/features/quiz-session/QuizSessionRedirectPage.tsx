import { Alert, Skeleton, Stack } from '@mui/material'
import { useEffect, useRef } from 'react'
import { useParams } from 'react-router'
import { useQuizSessionNavigate } from '../../hooks/useQuizSessionNavigate'

export function QuizSessionRedirectPage() {
  const { attemptId = '' } = useParams()
  const { goToSession, isResolving } = useQuizSessionNavigate()
  const requestedAttemptIdRef = useRef('')

  useEffect(() => {
    if (!attemptId || requestedAttemptIdRef.current === attemptId) {
      return
    }

    requestedAttemptIdRef.current = attemptId
    goToSession(attemptId)
  }, [attemptId, goToSession])

  return (
    <Stack spacing={2}>
      {isResolving ? (
        <Skeleton height={200} variant="rounded" />
      ) : (
        <Alert severity="info">Oturum yönlendiriliyor…</Alert>
      )}
    </Stack>
  )
}
