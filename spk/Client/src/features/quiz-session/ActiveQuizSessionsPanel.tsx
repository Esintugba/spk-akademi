import { useQuery } from '@tanstack/react-query'
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined'
import { Box, Button, Chip, Paper, Skeleton, Stack, Typography } from '@mui/material'
import { quizSessionApi } from '../../shared/api'
import { useQuizSessionNavigate } from '../../hooks/useQuizSessionNavigate'
import { formatRemaining, quizModeLabel, quizStatusLabel } from './quizSessionUtils'
import { QuizAttemptStatus } from '../../models/quizSession'

const ACTIVE_KEY = ['quiz-sessions', 'active'] as const

export function ActiveQuizSessionsPanel() {
  const { goToSession, isResolving } = useQuizSessionNavigate()
  const query = useQuery({
    queryKey: ACTIVE_KEY,
    queryFn: () => quizSessionApi.getActiveSessions(),
  })

  if (query.isLoading) {
    return <Skeleton height={120} variant="rounded" />
  }

  const sessions = query.data ?? []
  if (sessions.length === 0) {
    return null
  }

  return (
    <Paper sx={{ borderRadius: 3, p: 2.5 }} variant="outlined">
      <Typography sx={{ fontWeight: 800, mb: 2 }} variant="h6">
        Aktif oturumlar
      </Typography>
      <Stack spacing={1.5}>
        {sessions.map((session) => (
          <Box
            key={session.attemptId}
            sx={{
              alignItems: 'center',
              border: '1px solid rgba(148,163,184,0.2)',
              borderRadius: 2,
              display: 'grid',
              gap: 1,
              gridTemplateColumns: { md: '1fr auto', xs: '1fr' },
              p: 1.5,
            }}
          >
            <Box>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', mb: 0.5 }}>
                <Typography sx={{ fontWeight: 700 }}>{session.title || quizModeLabel(session.quizMode)}</Typography>
                <Chip label={quizModeLabel(session.quizMode)} size="small" variant="outlined" />
                <Chip
                  color={
                    session.status === QuizAttemptStatus.Expired
                      ? 'warning'
                      : session.status === QuizAttemptStatus.Completed
                        ? 'success'
                        : 'primary'
                  }
                  label={quizStatusLabel(session.status)}
                  size="small"
                />
              </Stack>
              <Typography color="text.secondary" variant="caption">
                Kalan: {formatRemaining(session.remainingTimeSeconds)} · Son aktivite:{' '}
                {session.lastActivityAt
                  ? new Date(session.lastActivityAt).toLocaleString('tr-TR')
                  : '—'}
              </Typography>
            </Box>
            <Button
              disabled={isResolving}
              onClick={() => goToSession(session.attemptId)}
              startIcon={<PlayArrowOutlinedIcon />}
              variant="contained"
            >
              Devam Et
            </Button>
          </Box>
        ))}
      </Stack>
    </Paper>
  )
}
