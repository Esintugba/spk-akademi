import { Alert, Skeleton, Stack } from '@mui/material'
import { useEffect } from 'react'
import { useParams } from 'react-router'
import { useQuizSessionNavigate } from '../../hooks/useQuizSessionNavigate'

export function QuizSessionRedirectPage() {
  const { attemptId = '' } = useParams()
  const { goToSession, isResolving } = useQuizSessionNavigate()

  useEffect(() => {
    if (attemptId) {
      goToSession(attemptId)
    }
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
