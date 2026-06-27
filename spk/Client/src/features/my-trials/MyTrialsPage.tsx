import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import FilterListOutlinedIcon from '@mui/icons-material/FilterListOutlined'
import { Alert, Box, FormControl, InputLabel, MenuItem, Select, Skeleton, Stack, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { AccessDenied } from '../../components/common/AccessDenied'
import { EmptyState } from '../../components/common/EmptyState'
import { StudentPageHero } from '../../components/common/StudentPageHero'
import {
  StudentTrialProgressStatus,
  type StudentAccessibleTrial,
} from '../../models/trialQuiz'
import { api, trialQuizApi } from '../../shared/api'
import { useQuizTrialStore } from '../../stores/quizTrialStore'
import { TrialCard } from './components/TrialCard'

const MY_TRIALS_QUERY_KEY = ['student', 'my-trials'] as const

type FilterValue = 'all' | 'free' | 'licensed' | 'not-started' | 'in-progress' | 'completed'

export function MyTrialsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const setSession = useQuizTrialStore((s) => s.setSession)
  const [filter, setFilter] = useState<FilterValue>('all')
  const [accessDenied, setAccessDenied] = useState(false)
  const [actionError, setActionError] = useState('')
  const [startingQuizId, setStartingQuizId] = useState<string | null>(null)

  const { data: trials = [], isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: MY_TRIALS_QUERY_KEY,
    queryFn: () => trialQuizApi.getMyTrials(),
  })

  const startMutation = useMutation({
    mutationFn: (quizId: string) => trialQuizApi.startLicensedTrial({ quizId }),
    onSuccess: (response) => {
      setSession(response.attemptId, response.quizId)
      void queryClient.invalidateQueries({ queryKey: MY_TRIALS_QUERY_KEY })
      navigate(`/my-trials/session/${response.attemptId}`)
    },
    onError: (err: Error) => {
      if (err.message.toLowerCase().includes('yetkin')) {
        setAccessDenied(true)
        return
      }
      setActionError(err.message)
    },
    onSettled: () => setStartingQuizId(null),
  })

  const filteredTrials = useMemo(() => {
    return trials.filter((trial) => {
      switch (filter) {
        case 'free':
          return trial.isFree
        case 'licensed':
          return !trial.isFree
        case 'not-started':
          return trial.progressStatus === StudentTrialProgressStatus.NotStarted
        case 'in-progress':
          return trial.progressStatus === StudentTrialProgressStatus.InProgress
        case 'completed':
          return trial.progressStatus === StudentTrialProgressStatus.Completed
        default:
          return true
      }
    })
  }, [filter, trials])

  async function handleStart(trial: StudentAccessibleTrial) {
    setActionError('')
    setAccessDenied(false)
    setStartingQuizId(trial.quizId)
    startMutation.mutate(trial.quizId)
  }

  function handleContinue(trial: StudentAccessibleTrial) {
    if (!trial.activeAttemptId) {
      return
    }

    setSession(trial.activeAttemptId, trial.quizId)
    navigate(`/quiz/session/${trial.activeAttemptId}`)
  }

  async function handleViewResults(trial: StudentAccessibleTrial) {
    setActionError('')

    try {
      const history = await api.getStudentTrialHistory()
      const completed = history.find(
        (item) => item.trialExamId === trial.quizId && item.isCompleted,
      )

      if (completed) {
        navigate(`/trials/${completed.attemptId}`)
        return
      }

      setActionError('Bu deneme için tamamlanmış kayıt bulunamadı.')
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Sonuçlar yüklenemedi.')
    }
  }

  if (accessDenied) {
    return (
      <Stack spacing={3}>
        <StudentPageHero
          eyebrow="Denemelerim"
          title="Erişim gerekli"
          description="Bu deneme için aktif lisans veya satın alma kaydı bulunamadı."
        />
        <AccessDenied />
      </Stack>
    )
  }

  if (isLoading) {
    return (
      <Stack spacing={2}>
        <Skeleton height={180} variant="rounded" />
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { md: 'repeat(3, 1fr)', xs: '1fr' } }}>
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} height={220} variant="rounded" />
          ))}
        </Box>
      </Stack>
    )
  }

  if (isError && trials.length === 0) {
    return (
      <Stack spacing={2}>
        <Alert severity="error">{error instanceof Error ? error.message : 'Denemeler yüklenemedi.'}</Alert>
        <Typography
          component="button"
          onClick={() => void refetch()}
          sx={{ alignSelf: 'flex-start', cursor: 'pointer', textDecoration: 'underline' }}
        >
          Tekrar dene
        </Typography>
      </Stack>
    )
  }

  return (
    <Stack spacing={3}>
      <StudentPageHero
        eyebrow="Denemelerim"
        title="Erişebildiğin Denemeler"
        description="Ücretsiz ve lisanslı denemelerini tek ekrandan yönet. Devam eden oturumları süre dolmadan tamamla."
        sideContent={
          <FormControl fullWidth size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="trial-filter-label">Filtre</InputLabel>
            <Select
              label="Filtre"
              labelId="trial-filter-label"
              onChange={(event) => setFilter(event.target.value as FilterValue)}
              startAdornment={<FilterListOutlinedIcon sx={{ mr: 1, opacity: 0.6 }} />}
              value={filter}
            >
              <MenuItem value="all">Tümü</MenuItem>
              <MenuItem value="free">Ücretsiz</MenuItem>
              <MenuItem value="licensed">Lisanslı</MenuItem>
              <MenuItem value="not-started">Başlamadı</MenuItem>
              <MenuItem value="in-progress">Devam ediyor</MenuItem>
              <MenuItem value="completed">Tamamlandı</MenuItem>
            </Select>
          </FormControl>
        }
      />

      {actionError && <Alert severity="error">{actionError}</Alert>}
      {isFetching && !isLoading && <Alert severity="info">Liste güncelleniyor…</Alert>}

      {filteredTrials.length === 0 ? (
        <EmptyState
          title="Gösterilecek deneme yok"
          description={
            trials.length === 0
              ? 'Erişimin olan ücretsiz veya lisanslı deneme henüz yok. Paketler sayfasından lisans alabilirsin.'
              : 'Seçili filtreye uygun deneme bulunamadı. Filtreyi değiştirmeyi dene.'
          }
        />
      ) : (
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { lg: 'repeat(3, 1fr)', md: 'repeat(2, 1fr)', xs: '1fr' },
          }}
        >
          {filteredTrials.map((trial) => (
            <TrialCard
              isStarting={startingQuizId === trial.quizId}
              key={trial.quizId}
              onContinue={handleContinue}
              onStart={handleStart}
              onViewResults={handleViewResults}
              trial={trial}
            />
          ))}
        </Box>
      )}
    </Stack>
  )
}
