import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined'
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined'
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined'
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined'
import { Alert, Box, Button, Chip, LinearProgress, Paper, Skeleton, Stack, Typography } from '@mui/material'
import { useNavigate, useParams } from 'react-router'
import { StudentPageHero } from '../../components/common/StudentPageHero'
import { useQuizTrialStore } from '../../stores/quizTrialStore'
import { useQuizOverview, useStartLicensedQuiz } from './hooks/useQuizCatalogQueries'
import { difficultyLabel, durationLabel, quizCtaLabel } from './quizCatalogUtils'

export function QuizOverviewPage() {
  const { quizId } = useParams()
  const navigate = useNavigate()
  const setSession = useQuizTrialStore((state) => state.setSession)

  const overviewQuery = useQuizOverview(quizId)
  const startMutation = useStartLicensedQuiz()

  const quiz = overviewQuery.data

  if (overviewQuery.isLoading) {
    return (
      <Stack spacing={2}>
        <Skeleton height={220} variant="rounded" />
        <Skeleton height={260} variant="rounded" />
      </Stack>
    )
  }

  if (!quiz) {
    return <Alert severity="error">Deneme detayı yüklenemedi.</Alert>
  }

  function handleAction() {
    if (!quiz) {
      return
    }

    if (quiz.userProgress.inProgress && quiz.userProgress.activeAttemptId) {
      setSession(quiz.userProgress.activeAttemptId, quiz.id)
      navigate(`/quiz/session/${quiz.userProgress.activeAttemptId}`)
      return
    }

    if (quiz.userProgress.completed) {
      navigate('/trials')
      return
    }

    startMutation.mutate(quiz.id)
  }

  return (
    <Stack spacing={3}>
      <StudentPageHero
        eyebrow={quiz.licenseName ?? 'Deneme'}
        title={quiz.title}
        description={quiz.description || 'Bu deneme için açıklama henüz eklenmedi.'}
        actions={
          <Button
            disabled={startMutation.isPending}
            onClick={handleAction}
            startIcon={<PlayArrowOutlinedIcon />}
            variant="contained"
          >
            {quizCtaLabel(quiz)}
          </Button>
        }
      />

      {startMutation.error instanceof Error && <Alert severity="error">{startMutation.error.message}</Alert>}

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { md: 'repeat(4, 1fr)', xs: 'repeat(2, 1fr)' } }}>
        <Paper elevation={0} sx={{ border: '1px solid rgba(148,163,184,0.22)', borderRadius: 2, p: 2 }}>
          <AccessTimeOutlinedIcon color="action" />
          <Typography sx={{ fontWeight: 900 }}>{durationLabel(quiz.duration)}</Typography>
          <Typography color="text.secondary" variant="body2">Süre</Typography>
        </Paper>
        <Paper elevation={0} sx={{ border: '1px solid rgba(148,163,184,0.22)', borderRadius: 2, p: 2 }}>
          <QuizOutlinedIcon color="action" />
          <Typography sx={{ fontWeight: 900 }}>{quiz.questionCount}</Typography>
          <Typography color="text.secondary" variant="body2">Soru</Typography>
        </Paper>
        <Paper elevation={0} sx={{ border: '1px solid rgba(148,163,184,0.22)', borderRadius: 2, p: 2 }}>
          <TrendingUpOutlinedIcon color="action" />
          <Typography sx={{ fontWeight: 900 }}>%{quiz.averageScore}</Typography>
          <Typography color="text.secondary" variant="body2">Ortalama Skor</Typography>
        </Paper>
        <Paper elevation={0} sx={{ border: '1px solid rgba(148,163,184,0.22)', borderRadius: 2, p: 2 }}>
          <Chip label={difficultyLabel(quiz.difficultyLevel)} />
          <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">Zorluk</Typography>
        </Paper>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid rgba(148,163,184,0.22)', borderRadius: 2, p: 2.5 }}>
        <Stack spacing={2}>
          <Typography sx={{ fontWeight: 900 }} variant="h6">Soru Dağılımı</Typography>
          {quiz.questionDistribution.length === 0 ? (
            <Typography color="text.secondary">Dağılım verisi henüz yok.</Typography>
          ) : (
            quiz.questionDistribution.map((item) => (
              <Stack key={`${item.courseId}-${item.topicId}`} spacing={0.75}>
                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                  <Typography sx={{ fontWeight: 750 }}>{item.topicTitle}</Typography>
                  <Typography color="text.secondary">{item.questionCount} soru</Typography>
                </Stack>
                <LinearProgress
                  value={(item.questionCount / Math.max(quiz.questionCount, 1)) * 100}
                  variant="determinate"
                />
                <Typography color="text.secondary" variant="caption">{item.courseName}</Typography>
              </Stack>
            ))
          )}
        </Stack>
      </Paper>
    </Stack>
  )
}
