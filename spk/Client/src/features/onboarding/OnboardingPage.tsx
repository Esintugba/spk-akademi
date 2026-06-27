import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import PlayCircleOutlineOutlinedIcon from '@mui/icons-material/PlayCircleOutlineOutlined'
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import {
  Alert,
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link as RouterLink, useNavigate } from 'react-router'
import { toast } from 'react-toastify'
import { selectCurrentUser } from '../../app/authSlice'
import { useAppSelector } from '../../app/hooks'
import { useAccessRequestStore } from '../../stores/accessRequestStore'
import { onboardingApi } from '../../shared/api'
import { OnboardingErrorBoundary } from './OnboardingErrorBoundary'

const STATUS_KEY = ['onboarding', 'status'] as const

export function OnboardingPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const currentUser = useAppSelector(selectCurrentUser)
  const openAccessRequest = useAccessRequestStore((s) => s.openModal)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: STATUS_KEY,
    queryFn: onboardingApi.getStatus,
    retry: 2,
  })

  const completeMutation = useMutation({
    mutationFn: () => onboardingApi.complete(3),
    onSuccess: (status) => {
      queryClient.setQueryData(STATUS_KEY, status)
      toast.success('Onboarding tamamlandı. Panele yönlendiriliyorsunuz.')
      navigate('/dashboard', { replace: true })
    },
    onError: () => toast.error('Onboarding kaydedilemedi.'),
  })

  if (isLoading) {
    return (
      <Stack spacing={2}>
        <Skeleton height={200} variant="rounded" />
        <Skeleton height={180} variant="rounded" />
        <Skeleton height={140} variant="rounded" />
      </Stack>
    )
  }

  if (isError || !data) {
    return (
      <Alert
        action={
          <Button color="inherit" onClick={() => void refetch()} size="small">
            Tekrar dene
          </Button>
        }
        severity="error"
      >
        Onboarding bilgisi yüklenemedi.
      </Alert>
    )
  }

  const studentName = currentUser?.email?.split('@')[0] || 'Öğrenci'
  const demo = data.demoPlan
  const isExpired = demo?.isExpired === true
  const progressPct = data.onboardingState
    ? Math.min(100, ((data.onboardingState.currentStep + 1) / 4) * 100)
    : 25

  function handleAccessRequest() {
    if (demo?.id) {
      openAccessRequest(demo.id, demo.name)
      return
    }

    navigate('/plans')
  }

  return (
    <OnboardingErrorBoundary>
      <Stack spacing={3}>
        <Paper sx={{ borderRadius: 4, overflow: 'hidden', p: { md: 4, xs: 3 } }} variant="outlined">
          <Stack spacing={2}>
            <Chip
              icon={<AutoAwesomeOutlinedIcon />}
              label="Hoş geldin"
              sx={{ alignSelf: 'flex-start', fontWeight: 700 }}
              color="primary"
              variant="outlined"
            />
            <Typography sx={{ fontSize: { md: 36, xs: 28 }, fontWeight: 900, lineHeight: 1.1 }}>
              Merhaba {studentName}, SPK Akademi&apos;ye hoş geldin
            </Typography>
            <Typography color="text.secondary" sx={{ lineHeight: 1.8, whiteSpace: 'pre-line' }}>
              {data.welcomeMessage}
            </Typography>
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 700, mb: 0.75 }}>Onboarding ilerlemesi</Typography>
              <LinearProgress sx={{ borderRadius: 999, height: 8 }} value={progressPct} variant="determinate" />
            </Box>
          </Stack>
        </Paper>

        <Paper sx={{ borderRadius: 4, p: { md: 3.5, xs: 2.5 } }} variant="outlined">
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography sx={{ fontSize: 20, fontWeight: 900 }}>Demo erişim durumu</Typography>
              {data.hasDemoAccess && !isExpired && (
                <Chip color="success" label="Demo Erişim" size="small" sx={{ fontWeight: 700 }} />
              )}
              {isExpired && <Chip color="warning" label="Demo Süresi Doldu" size="small" sx={{ fontWeight: 700 }} />}
            </Stack>

            {demo ? (
              <Stack spacing={1}>
                <Typography>
                  <Box component="span" sx={{ fontWeight: 800 }}>
                    Plan:
                  </Box>{' '}
                  {demo.name}
                </Typography>
                {!isExpired && (
                  <Typography color="text.secondary">
                    Kalan süre: <strong>{demo.daysRemaining} gün</strong> (bitiş:{' '}
                    {new Date(demo.expiresAt).toLocaleDateString('tr-TR')})
                  </Typography>
                )}
                <Typography color="text.secondary" variant="body2">
                  Günlük soru limiti: {data.demoLimits.questionsUsedToday}/{data.demoLimits.maxQuestionsPerDay} · Deneme
                  hakkı: {data.demoLimits.trialAttemptsUsed}/{data.demoLimits.maxTrialAttempts}
                </Typography>
              </Stack>
            ) : (
              <Typography color="text.secondary">Demo planı henüz tanımlanmadı. Destek ile iletişime geçebilirsiniz.</Typography>
            )}
          </Stack>
        </Paper>

        <Paper sx={{ borderRadius: 4, p: { md: 3.5, xs: 2.5 } }} variant="outlined">
          <Typography sx={{ fontSize: 20, fontWeight: 900, mb: 2 }}>Hızlı başlangıç</Typography>
          <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1.5}>
            <Button
              component={RouterLink}
              disabled={!data.hasDemoAccess || isExpired}
              startIcon={<PlayCircleOutlineOutlinedIcon />}
              to="/my-trials"
              variant="contained"
            >
              Demo Denemesini Başlat
            </Button>
            <Button component={RouterLink} startIcon={<SchoolOutlinedIcon />} to="/my-courses" variant="outlined">
              Dersleri Keşfet
            </Button>
            <Button onClick={handleAccessRequest} startIcon={<RocketLaunchOutlinedIcon />} variant="outlined">
              Erişim Talep Et
            </Button>
          </Stack>
        </Paper>

        <Paper sx={{ borderRadius: 4, p: 2.5 }} variant="outlined">
          <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
            <EmailOutlinedIcon color="action" fontSize="small" />
            <Typography color="text.secondary" variant="body2">
              Destek:{' '}
              <Box component="a" href={`mailto:${data.supportEmail}`} sx={{ color: 'primary.main', fontWeight: 700 }}>
                {data.supportEmail}
              </Box>
            </Typography>
          </Stack>
        </Paper>

        <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1.5}>
          <Button
            disabled={completeMutation.isPending}
            onClick={() => completeMutation.mutate()}
            size="large"
            variant="contained"
          >
            Panele geç
          </Button>
          <Button component={RouterLink} size="large" to="/plans" variant="text">
            Lisansları incele
          </Button>
        </Stack>
      </Stack>
    </OnboardingErrorBoundary>
  )
}
