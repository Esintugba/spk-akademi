import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined'
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
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
import type { Plan } from '../../models'
import { AccessRequestStatus } from '../../models/accessRequest'
import { useAccessRequestStore } from '../../stores/accessRequestStore'
import { accessRequestApi, api, onboardingApi } from '../../shared/api'
import { AccessRequestModal } from '../access-requests/AccessRequestModal'
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

  const plansQuery = useQuery({
    queryKey: ['plans', 'onboarding'],
    queryFn: api.getPlans,
    staleTime: 300_000,
  })

  const requestsQuery = useQuery({
    queryKey: ['access-requests', 'my'],
    queryFn: accessRequestApi.getMy,
    staleTime: 60_000,
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
  const plans = plansQuery.data ?? []
  const pendingPlanIds = new Set(
    (requestsQuery.data ?? [])
      .filter((request) => request.status === AccessRequestStatus.Pending || request.status === AccessRequestStatus.Waitlisted)
      .map((request) => request.planId),
  )
  const suggestedPlans = plans
    .filter((plan) => !plan.hasAccess)
    .slice(0, 3)

  function openPlanRequest(plan: Plan) {
    openAccessRequest({
      licenses: plan.licenses,
      planDescription: plan.shortDescription || plan.description,
      planId: plan.id,
      planName: plan.name,
      scope: plan.scope,
    })
  }

  function handleAccessRequest() {
    if (suggestedPlans[0]) {
      openPlanRequest(suggestedPlans[0])
      return
    }

    navigate('/plans')
  }

  return (
    <OnboardingErrorBoundary>
      <Stack spacing={3}>
        <AccessRequestModal />
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
          <Stack spacing={2.5}>
            <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1.5} sx={{ justifyContent: 'space-between' }}>
              <Box>
                <Typography sx={{ fontSize: 22, fontWeight: 900 }}>Erişim Kapsamınızı Seçin</Typography>
                <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                  Başvuru yapmadan önce paketin açtığı lisansları ve içerik kapsamlarını net olarak görebilirsiniz.
                </Typography>
              </Box>
              <Button component={RouterLink} to="/plans" variant="text">
                Tüm paketler
              </Button>
            </Stack>

            {plansQuery.isLoading ? (
              <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { md: 'repeat(3, 1fr)', xs: '1fr' } }}>
                {[1, 2, 3].map((item) => (
                  <Skeleton height={220} key={item} variant="rounded" />
                ))}
              </Box>
            ) : plansQuery.isError ? (
              <Alert severity="warning">Paket kapsamı yüklenemedi. Paketler sayfasından tekrar deneyebilirsiniz.</Alert>
            ) : suggestedPlans.length === 0 ? (
              <Alert severity="success">Talep edilebilir ek paket bulunmuyor. Aktif erişimleriniz panelde listelenecek.</Alert>
            ) : (
              <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { md: 'repeat(3, minmax(0, 1fr))', xs: '1fr' } }}>
                {suggestedPlans.map((plan) => {
                  const hasPending = pendingPlanIds.has(plan.id)
                  const visibleLicenses = plan.licenses.slice(0, 3)

                  return (
                    <Paper key={plan.id} sx={{ borderRadius: 3, display: 'flex', flexDirection: 'column', p: 2 }} variant="outlined">
                      <Stack spacing={1.5} sx={{ flexGrow: 1 }}>
                        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                          <Inventory2OutlinedIcon color="primary" />
                          <Chip
                            color={hasPending ? 'warning' : 'default'}
                            label={hasPending ? 'Başvuru inceleniyor' : 'Erişim gerekli'}
                            size="small"
                          />
                        </Stack>
                        <Box>
                          <Typography sx={{ fontSize: 19, fontWeight: 900 }}>{plan.name}</Typography>
                          <Typography color="text.secondary" sx={{ lineHeight: 1.65, mt: 0.75 }} variant="body2">
                            {plan.shortDescription || plan.description || 'Bu paket için açıklama yakında eklenecek.'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { sm: 'repeat(3, minmax(0, 1fr))', xs: '1fr' } }}>
                          <MiniMetric label="Ders" value={plan.scope.courseCount} />
                          <MiniMetric label="Konu" value={plan.scope.topicCount} />
                          <MiniMetric label="Soru" value={plan.scope.questionCount} />
                        </Box>
                        <Stack spacing={0.75}>
                          {visibleLicenses.map((license) => (
                            <Stack direction="row" key={license.id} spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
                              <CheckCircleOutlineOutlinedIcon color="primary" fontSize="small" />
                              <Typography noWrap sx={{ fontWeight: 750 }} variant="body2">
                                {license.name}
                              </Typography>
                            </Stack>
                          ))}
                          {plan.licenses.length > visibleLicenses.length && (
                            <Typography color="text.secondary" variant="body2">
                              +{plan.licenses.length - visibleLicenses.length} lisans daha
                            </Typography>
                          )}
                        </Stack>
                      </Stack>
                      <Button
                        disabled={hasPending}
                        onClick={() => openPlanRequest(plan)}
                        startIcon={<RocketLaunchOutlinedIcon />}
                        sx={{ mt: 2 }}
                        variant="contained"
                      >
                        {hasPending ? 'Başvuru beklemede' : 'Bu pakete başvur'}
                      </Button>
                    </Paper>
                  )
                })}
              </Box>
            )}
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

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <Box sx={{ bgcolor: 'rgba(15,23,42,0.035)', borderRadius: 2, p: 1 }}>
      <Typography noWrap sx={{ fontSize: 17, fontWeight: 900 }}>
        {formatNumber(value)}
      </Typography>
      <Typography color="text.secondary" noWrap sx={{ fontSize: 11, fontWeight: 700 }}>
        {label}
      </Typography>
    </Box>
  )
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('tr-TR').format(value)
}
