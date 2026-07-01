import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import ArrowRightAltOutlinedIcon from '@mui/icons-material/ArrowRightAltOutlined'
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined'
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined'
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined'
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined'
import LibraryBooksOutlinedIcon from '@mui/icons-material/LibraryBooksOutlined'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import NoteAltOutlinedIcon from '@mui/icons-material/NoteAltOutlined'
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined'
import PlayCircleOutlineOutlinedIcon from '@mui/icons-material/PlayCircleOutlineOutlined'
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined'
import ReplayOutlinedIcon from '@mui/icons-material/ReplayOutlined'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import ShuffleOutlinedIcon from '@mui/icons-material/ShuffleOutlined'
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined'
import TrackChangesOutlinedIcon from '@mui/icons-material/TrackChangesOutlined'
import TrendingDownOutlinedIcon from '@mui/icons-material/TrendingDownOutlined'
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
import { Link as RouterLink } from 'react-router'
import { toast } from 'react-toastify'
import { selectCurrentUser } from '../../app/authSlice'
import { useAppSelector } from '../../app/hooks'
import { useGamificationStore } from '../../stores/gamificationStore'
import { announceLevelUp } from '../../features/gamification/announceGamification'
import {
  AdaptiveStudyTaskType,
  UserDefaultQuizMode,
  type AccountProfile,
  type AdaptiveStudyPlan,
  type AdaptiveStudyTask,
  type GamificationProfile,
  type StudentAnalytics,
  type StudentProgram,
} from '../../models'
import { api } from '../../shared/api'
import { ActiveQuizSessionsPanel } from '../../features/quiz-session/ActiveQuizSessionsPanel'
import { EmptyState } from '../common/EmptyState'
import { AccessRequestModal } from '../../features/access-requests/AccessRequestModal'
import { DashboardAccessBanner } from '../../features/onboarding/DashboardAccessBanner'
import { gamificationApi, onboardingApi, studyPlanApi, supportTicketsApi } from '../../shared/api'

export function StudentDashboardPage() {
  const currentUser = useAppSelector(selectCurrentUser)
  const queryClient = useQueryClient()
  const enqueueCelebration = useGamificationStore((state) => state.enqueueNotice)

  const { data: onboardingStatus } = useQuery({
    queryKey: ['onboarding', 'status'],
    queryFn: onboardingApi.getStatus,
    staleTime: 60_000,
  })
  const { data: plans = [] } = useQuery({
    queryKey: ['plans'],
    queryFn: api.getPlans,
    staleTime: 300_000,
  })
  const { data: supportSummary } = useQuery({
    queryKey: ['support-tickets', 'my-summary'],
    queryFn: supportTicketsApi.getMySummary,
    staleTime: 60_000,
  })
  const { data: userSettings } = useQuery({
    queryKey: ['settings'],
    queryFn: api.settings.get,
    staleTime: 300_000,
  })
  const { data: todayPlan, isLoading: isStudyPlanLoading } = useQuery({
    queryKey: ['study-plan', 'today'],
    queryFn: studyPlanApi.getToday,
    staleTime: 60_000,
  })
  const completeTaskMutation = useMutation({
    mutationFn: (task: AdaptiveStudyTask) =>
      studyPlanApi.completeTask(task.id, {
        actualMinutes: task.targetMinutes,
        actualQuestions: task.targetQuestions,
    }),
    onSuccess: async (plan) => {
      const completedTask = completeTaskMutation.variables
      const previousProfile = queryClient.getQueryData<GamificationProfile>(['gamification', 'profile'])
      queryClient.setQueryData(['study-plan', 'today'], plan)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['study-plan'] }),
        queryClient.invalidateQueries({ queryKey: ['gamification'] }),
        queryClient.invalidateQueries({ queryKey: ['goals'] }),
      ])
      try {
        const nextProfile = await queryClient.fetchQuery({
          queryKey: ['gamification', 'profile'],
          queryFn: gamificationApi.getProfile,
        })
        announceLevelUp(nextProfile, previousProfile?.level)
      } catch {
        // Profile refresh is celebratory only; task completion should still succeed.
      }

      if (completedTask) {
        enqueueCelebration({
          id: `adaptive-task-${completedTask.id}-${Date.now()}`,
          type: 'task',
          title: 'Plan görevi tamamlandı',
          description: `${completedTask.title} için XP, hedef ve streak ilerlemesi güncellendi.`,
        })
      }
      toast.success('Plan görevi tamamlandı.')
    },
  })

  const [program, setProgram] = useState<StudentProgram | null>(null)
  const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null)
  const [profile, setProfile] = useState<AccountProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadProgram() {
      try {
        const [programResponse, analyticsResponse, profileResponse] = await Promise.all([
          api.getStudentProgram(),
          api.getStudentAnalytics(),
          api.getMyProfile(),
        ])

        if (!isMounted) {
          return
        }

        setProgram(programResponse)
        setAnalytics(analyticsResponse)
        setProfile(profileResponse)
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Öğrenci paneli yüklenemedi.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadProgram()

    return () => {
      isMounted = false
    }
  }, [])

  const studentName = profile?.displayName?.trim() || currentUser?.email?.split('@')[0] || 'Öğrenci'
  const weeklyMinutes = Number(analytics?.estimatedWeeklyStudyMinutes || 0)
  const dailyStudyGoal = userSettings?.dailyStudyMinutes ?? 45
  const weeklyGoal = Math.max(dailyStudyGoal * 7, Math.ceil(weeklyMinutes / 60) * 60 || dailyStudyGoal * 7)
  const weeklyPct = Math.min(100, Math.round((weeklyMinutes / weeklyGoal) * 100))
  const streak = useMemo(() => calculateStreak(analytics?.dailyTrend), [analytics?.dailyTrend])

  if (isLoading) {
    return (
      <Stack spacing={2}>
        <Skeleton height={260} variant="rounded" />
        <Skeleton height={220} variant="rounded" />
        <Skeleton height={280} variant="rounded" />
      </Stack>
    )
  }

  if (error && !program) {
    return <Alert severity="error">{error}</Alert>
  }

  if (!program) {
    return <EmptyState title="Program bilgisi bulunamadı" description="Öğrenci paneli şu anda hazırlanamadı." />
  }

  const accessibleLicenses = program.licenses.filter((license) => license.hasAccess)
  const activePlans = plans.filter((plan) => plan.hasAccess)
  const hasFullAccess = onboardingStatus?.hasFullAccess ?? false
  const hasDemoAccess = onboardingStatus?.hasDemoAccess ?? false
  const unlockedLicenses = activePlans.length > 0
    ? activePlans.flatMap((plan) => plan.licenses).filter((license, index, items) =>
        items.findIndex((item) => item.id === license.id) === index)
    : accessibleLicenses.map((license) => ({
        id: license.licenseId,
        name: license.licenseName,
      }))

  if (accessibleLicenses.length === 0 && !hasFullAccess && !hasDemoAccess) {
    return (
      <Stack spacing={3}>
        <AccessRequestModal />
        <DashboardAccessBanner />
        <EmptyState
          title="Henüz aktif erişimin yok"
          description="Admin onayı beklenirken onboarding ekranından demo erişimini kontrol edebilir veya erişim talebi gönderebilirsin."
        />
        <Button component={RouterLink} to="/onboarding" variant="contained">
          Onboarding&apos;e git
        </Button>
      </Stack>
    )
  }

  return (
    <Stack spacing={4}>
      <AccessRequestModal />
      <DashboardAccessBanner />
      {error && <Alert severity="error">{error}</Alert>}

      <Paper
        sx={{
          borderRadius: 4,
          overflow: 'hidden',
          p: { md: 4.5, xs: 3 },
          position: 'relative',
        }}
        variant="outlined"
      >
        <Box
          sx={{
            background: 'radial-gradient(circle at top right, rgba(37,99,235,0.12), transparent 35%), radial-gradient(circle at bottom left, rgba(20,184,166,0.12), transparent 35%)',
            inset: 0,
            position: 'absolute',
          }}
        />
        <Box sx={{ display: 'grid', gap: 4, gridTemplateColumns: { lg: '1.35fr 0.9fr', xs: '1fr' }, position: 'relative' }}>
          <Box>
            <Chip
              icon={<AutoAwesomeOutlinedIcon />}
              label="Benim Programım"
              sx={{ bgcolor: 'rgba(15,118,110,0.08)', color: 'primary.main', fontWeight: 700 }}
            />
            <Typography component="h1" sx={{ fontSize: { md: 46, xs: 32 }, fontWeight: 900, lineHeight: 1.08, mt: 2.5 }}>
              Merhaba {studentName},{' '}
              <Box component="span" sx={{ color: 'primary.main' }}>
                kaldığın yerden
              </Box>{' '}
              devam et.
            </Typography>
            <Typography color="text.secondary" sx={{ lineHeight: 1.85, maxWidth: 720, mt: 2 }}>
              Erişimin olan lisansları, son çalıştığın konuları ve yaklaşan tekrar hedeflerini tek ekranda gör.
            </Typography>
            <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1.5} sx={{ mt: 3.5 }}>
              <Button
                component={RouterLink}
                endIcon={<ArrowRightAltOutlinedIcon />}
                sx={{ px: 2.5, py: 1.25 }}
                to={program.continueLearning ? `/study/${program.continueLearning.topicId}` : '/study-notes'}
                variant="contained"
              >
                Konuya devam et
              </Button>
              <Button
                component={RouterLink}
                startIcon={<PlayCircleOutlineOutlinedIcon />}
                sx={{ px: 2.5, py: 1.25 }}
                to={
                  program.continueTrial
                    ? `/quiz/session/${program.continueTrial.attemptId}`
                    : '/free-trial'
                }
                variant="outlined"
              >
                {program.continueTrial ? 'Denemeye devam et' : 'Demo dene'}
              </Button>
            </Stack>
          </Box>

          <Paper sx={{ borderRadius: 3, p: 3 }} variant="outlined">
            <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="text.secondary" sx={{ fontSize: 13, fontWeight: 700 }}>
                  Bu hafta
                </Typography>
                <Typography sx={{ fontSize: 34, fontWeight: 900, mt: 1 }}>
                  {weeklyMinutes}
                  <Box component="span" sx={{ color: 'text.secondary', fontSize: 16, fontWeight: 700 }}>
                    /{weeklyGoal} dk
                  </Box>
                </Typography>
              </Box>
              <Box
                sx={{
                  alignItems: 'center',
                  bgcolor: 'rgba(15,118,110,0.08)',
                  borderRadius: 3,
                  color: 'primary.main',
                  display: 'flex',
                  height: 52,
                  justifyContent: 'center',
                  width: 52,
                }}
              >
                <TrackChangesOutlinedIcon />
              </Box>
            </Stack>
            <LinearProgress
              sx={{ borderRadius: 999, height: 10, mt: 3 }}
              value={weeklyPct}
              variant="determinate"
            />
            <Typography color="text.secondary" sx={{ fontSize: 12, fontWeight: 600, mt: 1.25 }}>
              %{weeklyPct} tamamlandı · hedefe {Math.max(0, weeklyGoal - weeklyMinutes)} dk
            </Typography>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 2.5 }}>
              <EmojiEventsOutlinedIcon sx={{ color: '#f59e0b', fontSize: 18 }} />
              <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
                {streak} gün çalışma serisi
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mt: 2 }}>
              <Chip label={`Gunluk hedef: ${userSettings?.dailyGoalQuestionCount ?? 25} soru`} size="small" />
              <Chip
                color={userSettings?.reviewReminder === false ? 'default' : 'primary'}
                label={userSettings?.reviewReminder === false ? 'Tekrar bildirimi kapali' : 'Tekrar bildirimi acik'}
                size="small"
              />
            </Stack>
          </Paper>
        </Box>
      </Paper>

      <AdaptivePlanCard
        completingTaskId={completeTaskMutation.variables?.id}
        isCompleting={completeTaskMutation.isPending}
        isLoading={isStudyPlanLoading}
        plan={todayPlan}
        onCompleteTask={(task) => completeTaskMutation.mutate(task)}
      />

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { lg: 'repeat(5, 1fr)', sm: 'repeat(2, 1fr)', xs: '1fr' } }}>
        <QuickActionCard
          description="Lisansındaki derslere ve kaldığın konulara dön."
          icon={<LibraryBooksOutlinedIcon />}
          label="Derslerim"
          to="/my-courses"
        />
        <QuickActionCard
          description="Tüm içeriklerden rastgele sorularla hızlı pratik yap."
          icon={<ShuffleOutlinedIcon />}
          label="Karışık Test"
          to={getDefaultQuizPath(userSettings?.defaultQuizMode)}
        />
        <QuickActionCard
          description="Yayınlanmış denemeleri keşfet ve yeni deneme başlat."
          icon={<QuizOutlinedIcon />}
          label="Deneme Kataloğu"
          to="/quizzes"
        />
        <QuickActionCard
          description="Bugün tekrar etmen gereken konuları tamamla."
          icon={<ReplayOutlinedIcon />}
          label="Bugünkü Tekrarlar"
          to="/reviews/today"
        />
        <QuickActionCard
          description="Yanlış cevaplarını gör, zayıf alanlarına çalış."
          icon={<TrendingDownOutlinedIcon />}
          label="Yanlışlarım"
          to="/quiz/wrong-answers"
        />
      </Box>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { md: 'repeat(3, 1fr)', xs: '1fr' } }}>
        <QuickActionCard
          description="Tüm konu listesini derslere göre filtrele ve çalışmayla başla."
          icon={<LibraryBooksOutlinedIcon />}
          label="Konularım"
          to="/my-topics"
        />
        <QuickActionCard
          description="PDF kaynaklarını, okuma ilerlemeni ve son açılanları gör."
          icon={<PictureAsPdfOutlinedIcon />}
          label="Kaynaklarım"
          to="/my-materials"
        />
        <QuickActionCard
          description="PDF üzerinde aldığın notlara tek ekrandan geri dön."
          icon={<NoteAltOutlinedIcon />}
          label="Notlarım"
          to="/my-notes"
        />
      </Box>

      <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { lg: 'repeat(2, 1fr)', xs: '1fr' } }}>
        <ContinueCard
          cta="Konuya dön"
          meta={
            program.continueLearning?.lastStudiedAt
              ? `Son çalışma: ${formatDateTime(program.continueLearning.lastStudiedAt)}`
              : 'Henüz çalışma geçmişi yok'
          }
          progress={findContinueLearningProgress(program)}
          subtitle={
            program.continueLearning
              ? `${program.continueLearning.licenseName} · ${program.continueLearning.courseName}`
              : 'İlk konunu çalışmaya başladığında burada göreceksin.'
          }
          tag="Kaldığın yer"
          title={program.continueLearning?.topicTitle || 'Çalışma geçmişi yok'}
          to={program.continueLearning ? `/study/${program.continueLearning.topicId}` : '/study-notes'}
        />

        <ContinueCard
          cta="Denemeye devam et"
          meta={
            program.continueTrial?.startedAt
              ? `Başlangıç: ${formatDateTime(program.continueTrial.startedAt)}`
              : 'Aktif deneme başlattığında burada göreceksin.'
          }
          progress={findContinueTrialProgress(program, analytics)}
          subtitle={
            program.continueTrial
              ? `${program.continueTrial.questionCount} soru · ${program.continueTrial.durationMinutes || 0} dakika`
              : 'Ücretsiz veya kayıtlı deneme akışına panelden devam edebilirsin.'
          }
          tag="Denemeye devam et"
          title={program.continueTrial?.trialTitle || 'Aktif ücretsiz deneme yok'}
          to={
            program.continueTrial
              ? `/quiz/session/${program.continueTrial.attemptId}`
              : '/free-trial'
          }
          tone="accent"
        />
      </Box>

      <ActiveQuizSessionsPanel />

      <Paper sx={{ borderRadius: 3, p: { md: 3, xs: 2.5 } }} variant="outlined">
        <Stack direction={{ md: 'row', xs: 'column' }} spacing={2.5} sx={{ alignItems: { md: 'center', xs: 'stretch' }, justifyContent: 'space-between' }}>
          <Box>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <SupportAgentOutlinedIcon color="primary" />
              <Typography sx={{ fontSize: 24, fontWeight: 900 }}>Destek Taleplerim</Typography>
            </Stack>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              Açık taleplerini ve admin yanıtı bekleyen konuları takip et.
            </Typography>
          </Box>
          <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1.5}>
            <Chip color="primary" label={`Açık: ${supportSummary?.openTickets ?? 0}`} />
            <Chip color="warning" label={`Admin bekleyen: ${supportSummary?.waitingForAdmin ?? 0}`} />
            <Chip color="info" label={`Yanıt bekleyen: ${supportSummary?.waitingForUser ?? 0}`} />
            <Button component={RouterLink} to="/support/my-tickets" variant="outlined">Talepleri Aç</Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper sx={{ borderRadius: 3, p: { md: 3, xs: 2.5 } }} variant="outlined">
        <Stack direction={{ md: 'row', xs: 'column' }} spacing={2.5} sx={{ justifyContent: 'space-between' }}>
          <Box>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Inventory2OutlinedIcon color="primary" />
              <Typography sx={{ fontSize: 24, fontWeight: 900 }}>Aktif Paketim</Typography>
            </Stack>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              {activePlans.length > 0 ? activePlans.map((plan) => plan.name).join(', ') : 'Paket eşleşmesi bulunamadı'}
            </Typography>
          </Box>
          <Box sx={{ minWidth: { md: 360, xs: 'auto' } }}>
            <Typography sx={{ fontWeight: 850, mb: 1 }}>Açılan Lisanslar</Typography>
            <Stack spacing={0.75}>
              {unlockedLicenses.slice(0, 6).map((license) => (
                <Stack direction="row" key={license.id} spacing={1} sx={{ alignItems: 'center' }}>
                  <CheckCircleOutlineOutlinedIcon color="success" fontSize="small" />
                  <Typography sx={{ fontWeight: 700 }} variant="body2">{license.name}</Typography>
                </Stack>
              ))}
              {unlockedLicenses.length > 6 && (
                <Typography color="text.secondary" variant="body2">+{unlockedLicenses.length - 6} lisans daha</Typography>
              )}
            </Stack>
          </Box>
        </Stack>
      </Paper>

      <Box>
        <Stack direction={{ md: 'row', xs: 'column' }} spacing={1} sx={{ alignItems: { md: 'flex-end', xs: 'flex-start' }, justifyContent: 'space-between', mb: 2.5 }}>
          <Box>
            <Typography sx={{ fontSize: 28, fontWeight: 900 }}>Erişimin olan lisanslar</Typography>
            <Typography color="text.secondary" variant="body2">
              İlerlemeni takip et, kaldığın yerden devam et.
            </Typography>
          </Box>
          <Button component={RouterLink} endIcon={<ArrowRightAltOutlinedIcon />} to="/plans" variant="text">
            Tümünü gör
          </Button>
        </Stack>

        {program.licenses.length === 0 ? (
          <EmptyState title="Henüz lisans erişimi görünmüyor" description="Erişim atandığında lisans kartların burada listelenecek." />
        ) : (
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { md: 'repeat(2, 1fr)', xs: '1fr' } }}>
            {program.licenses.map((license) => (
              <Paper
                key={license.licenseId}
                sx={{
                  borderRadius: 3,
                  p: 2.5,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: 'rgba(15,118,110,0.35)',
                    boxShadow: '0 18px 34px rgba(15, 118, 110, 0.08)',
                  },
                }}
                variant="outlined"
              >
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <Stack direction="row" spacing={1.5}>
                    <Box
                      sx={{
                        alignItems: 'center',
                        background: 'linear-gradient(135deg, rgba(15,118,110,0.12) 0%, rgba(37,99,235,0.10) 100%)',
                        borderRadius: 2.5,
                        color: 'primary.main',
                        display: 'flex',
                        height: 44,
                        justifyContent: 'center',
                        width: 44,
                      }}
                    >
                      <SchoolOutlinedIcon fontSize="small" />
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 800 }}>{license.licenseName}</Typography>
                      <Typography color="text.secondary" variant="body2">
                        {license.completedCourseCount} / {license.totalCourseCount} ders tamamlandı
                      </Typography>
                    </Box>
                  </Stack>
                  <Chip
                    color={license.hasAccess ? 'primary' : 'default'}
                    label={license.hasAccess ? 'Aktif erişim' : 'Erişim yok'}
                    size="small"
                  />
                </Stack>
                <LinearProgress
                  sx={{ borderRadius: 999, height: 8, mt: 2.5 }}
                  value={Number(license.progressPercentage)}
                  variant="determinate"
                />
                <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', mt: 1.5 }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 700 }}>İlerleme %{Math.round(Number(license.progressPercentage))}</Typography>
                  <Typography color="text.secondary" sx={{ fontSize: 12 }}>
                    Son: {license.lastStudiedCourseName || 'Henüz yok'}
                  </Typography>
                </Stack>
              </Paper>
            ))}
          </Box>
        )}
      </Box>

      <Box>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 2.5 }}>
          <FlagOutlinedIcon color="primary" />
          <Typography sx={{ fontSize: 28, fontWeight: 900 }}>Yaklaşan hedefler</Typography>
        </Stack>

        {program.upcomingGoals.length === 0 ? (
          <EmptyState title="Yaklaşan hedef görünmüyor" description="Tekrar tarihi yaklaşan konular burada gösterilecek." />
        ) : (
          <Paper sx={{ borderRadius: 3, overflow: 'hidden' }} variant="outlined">
            {program.upcomingGoals.map((goal, index) => (
              <Stack
                direction={{ md: 'row', xs: 'column' }}
                key={goal.topicId}
                spacing={2}
                sx={{
                  alignItems: { md: 'center', xs: 'flex-start' },
                  borderTop: index === 0 ? 'none' : '1px solid rgba(148,163,184,0.14)',
                  justifyContent: 'space-between',
                  p: 2.5,
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 800 }}>{goal.topicTitle}</Typography>
                  <Typography color="text.secondary" variant="body2">
                    {goal.courseName}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                  <Chip
                    label={getStudyStatusLabel(goal.status)}
                    size="small"
                    sx={getGoalChipStyle(goal.status)}
                  />
                  <Typography color="text.secondary" variant="body2">
                    {formatDateTime(goal.nextReviewAt)}
                  </Typography>
                  <Button component={RouterLink} endIcon={<ArrowRightAltOutlinedIcon />} size="small" to={`/study/${goal.topicId}`} variant="outlined">
                    Aç
                  </Button>
                </Stack>
              </Stack>
            ))}
          </Paper>
        )}
      </Box>
    </Stack>
  )
}

function AdaptivePlanCard({
  completingTaskId,
  isCompleting,
  isLoading,
  plan,
  onCompleteTask,
}: {
  completingTaskId?: string
  isCompleting: boolean
  isLoading: boolean
  plan?: AdaptiveStudyPlan
  onCompleteTask: (task: AdaptiveStudyTask) => void
}) {
  if (isLoading) {
    return <Skeleton height={260} variant="rounded" />
  }

  const tasks = plan?.tasks ?? []
  const reviewQuestionCount = tasks
    .filter((task) => task.type === AdaptiveStudyTaskType.Review)
    .reduce((total, task) => total + Math.max(1, task.targetQuestions || 0), 0)
  const topicCount = tasks.filter((task) => task.type === AdaptiveStudyTaskType.TopicStudy).length
  const questionCount = tasks
    .filter((task) => task.type === AdaptiveStudyTaskType.Quiz || task.type === AdaptiveStudyTaskType.WrongAnswerAnalysis)
    .reduce((total, task) => total + Math.max(0, task.targetQuestions), 0)

  return (
    <Paper sx={{ borderRadius: 3, overflow: 'hidden', p: { md: 3, xs: 2 } }} variant="outlined">
      <Box
        sx={{
          display: 'grid',
          gap: { md: 3, xs: 2 },
          gridTemplateColumns: { xl: 'minmax(0, 1.05fr) minmax(320px, 0.95fr)', xs: '1fr' },
          minWidth: 0,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', minWidth: 0 }}>
            <TrackChangesOutlinedIcon color="primary" />
            <Typography sx={{ fontSize: { sm: 24, xs: 21 }, fontWeight: 900 }}>Bugünün Planı</Typography>
            <Chip color="primary" label={`%${Math.round(Number(plan?.completionRate ?? 0))}`} size="small" />
          </Stack>
          <Typography color="text.secondary" sx={{ lineHeight: 1.65, mt: 1 }}>
            {plan?.summary || 'Plan üretmek için aktif konu, tekrar veya quiz verisi bekleniyor.'}
          </Typography>

          <Box sx={{ display: 'grid', gap: 1.25, gridTemplateColumns: { lg: 'repeat(4, minmax(0, 1fr))', xs: 'repeat(2, minmax(0, 1fr))' }, mt: 2.5 }}>
            <PlanMetric label="Tekrar" value={String(reviewQuestionCount)} />
            <PlanMetric label="Konu" value={String(topicCount)} />
            <PlanMetric label="Soru" value={String(questionCount)} />
            <PlanMetric label="Süre" value={`${plan?.estimatedMinutes ?? 0} dk`} />
          </Box>

          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mt: 2.5 }}>
            <Chip label={`Sınavaya kalan: ${plan?.daysUntilExam ?? 0} gün`} sx={{ maxWidth: '100%' }} />
            <Chip color="primary" label={`Tahmini tamamlama: %${Math.round(Number(plan?.estimatedTargetCompletionRate ?? 0))}`} sx={{ maxWidth: '100%' }} />
          </Stack>

          {plan?.riskyTopics?.length ? (
            <Stack spacing={1} sx={{ mt: 2.5 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 900 }}>Riskli Alt Konular</Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', minWidth: 0 }}>
                {plan.riskyTopics.slice(0, 4).map((topic) => (
                  <Chip
                    component={RouterLink}
                    key={topic.topicId}
                    label={`${topic.mainTopicTitle ? `${topic.mainTopicTitle} > ` : ''}${topic.topicTitle} - %${Math.round(topic.successRate)}`}
                    size="small"
                    sx={{
                      alignItems: 'flex-start',
                      fontWeight: 700,
                      height: 'auto',
                      maxWidth: '100%',
                      py: 0.35,
                      '& .MuiChip-label': {
                        display: 'block',
                        overflow: 'visible',
                        overflowWrap: 'anywhere',
                        whiteSpace: 'normal',
                      },
                    }}
                    to={`/study/${topic.topicId}`}
                    variant="outlined"
                    clickable
                  />
                ))}
              </Stack>
            </Stack>
          ) : null}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack spacing={1.25}>
            {tasks.length === 0 ? (
              <EmptyState title="Bugün için görev yok" description="Yeni ilerleme, tekrar veya quiz verisi oluştuğunda plan otomatik güncellenir." />
            ) : (
              tasks.slice(0, 5).map((task) => (
                <PlanTaskRow
                  isCompleting={isCompleting && completingTaskId === task.id}
                  key={task.id}
                  task={task}
                  onComplete={() => onCompleteTask(task)}
                />
              ))
            )}
          </Stack>

          {plan?.criticalWeeklyTasks?.length ? (
            <Stack spacing={0.75} sx={{ mt: 2.5 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 900 }}>Bu Hafta Kritik</Typography>
              {plan.criticalWeeklyTasks.slice(0, 3).map((item) => (
                <Stack direction="row" key={item} spacing={1} sx={{ alignItems: 'center' }}>
                  <CheckCircleOutlineOutlinedIcon color="success" fontSize="small" />
                  <Typography color="text.secondary" variant="body2">{item}</Typography>
                </Stack>
              ))}
            </Stack>
          ) : null}
        </Box>
      </Box>
    </Paper>
  )
}

function PlanMetric({ label, value }: { label: string; value: string }) {
  return (
    <Paper sx={{ borderRadius: 2, p: 1.5 }} variant="outlined">
      <Typography color="text.secondary" sx={{ fontSize: 12, fontWeight: 700 }}>{label}</Typography>
      <Typography sx={{ fontSize: 22, fontWeight: 900 }}>{value}</Typography>
    </Paper>
  )
}

function PlanTaskRow({
  isCompleting,
  task,
  onComplete,
}: {
  isCompleting: boolean
  task: AdaptiveStudyTask
  onComplete: () => void
}) {
  return (
    <Paper sx={{ borderRadius: 2, p: 1.5 }} variant="outlined">
      <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1.25} sx={{ alignItems: { sm: 'center', xs: 'stretch' }, justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'flex-start', minWidth: 0 }}>
          <Box
            sx={{
              alignItems: 'center',
              bgcolor: 'rgba(15,118,110,0.08)',
              borderRadius: 2,
              color: 'primary.main',
              display: 'flex',
              flexShrink: 0,
              height: 38,
              justifyContent: 'center',
              width: 38,
            }}
          >
            {getTaskIcon(task.type)}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography sx={{ fontWeight: 900 }}>{task.title}</Typography>
              {task.completed && <Chip color="success" label="Tamamlandı" size="small" />}
            </Stack>
            <Typography color="text.secondary" sx={{ fontSize: 12.5, lineHeight: 1.45 }}>
              {(task.actualMinutes || task.targetMinutes)} dk
              {(task.actualQuestions || task.targetQuestions) > 0 ? ` - ${task.actualQuestions || task.targetQuestions} soru` : ''}
              {task.courseName ? ` - ${task.courseName}` : ''}
              {task.mainTopicTitle ? ` - Ana konu: ${task.mainTopicTitle}` : ''}
            </Typography>
          </Box>
        </Stack>
        <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1} sx={{ flexShrink: 0, '& .MuiButton-root': { width: { sm: 'auto', xs: '100%' } } }}>
          <Button component={RouterLink} size="small" to={task.actionUrl || '/my-courses'} variant="outlined">
            Başla
          </Button>
          <Button disabled={task.completed || isCompleting} onClick={onComplete} size="small" variant="contained">
            {task.completed ? 'Bitti' : 'Tamamla'}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  )
}

function getTaskIcon(type: AdaptiveStudyTaskType) {
  switch (type) {
    case AdaptiveStudyTaskType.Review:
      return <ReplayOutlinedIcon fontSize="small" />
    case AdaptiveStudyTaskType.Quiz:
      return <QuizOutlinedIcon fontSize="small" />
    case AdaptiveStudyTaskType.WrongAnswerAnalysis:
      return <TrendingDownOutlinedIcon fontSize="small" />
    default:
      return <SchoolOutlinedIcon fontSize="small" />
  }
}

function QuickActionCard({
  description,
  icon,
  label,
  to,
}: {
  description: string
  icon: ReactNode
  label: string
  to: string
}) {
  return (
    <Paper
      component={RouterLink}
      sx={{
        alignItems: 'flex-start',
        borderRadius: 3,
        color: 'text.primary',
        display: 'flex',
        gap: 1.5,
        minHeight: 118,
        p: 2.25,
        textDecoration: 'none',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: 'rgba(15,118,110,0.36)',
          boxShadow: '0 16px 32px rgba(15, 118, 110, 0.08)',
          transform: 'translateY(-2px)',
        },
      }}
      to={to}
      variant="outlined"
    >
      <Box
        sx={{
          alignItems: 'center',
          bgcolor: 'rgba(15,118,110,0.08)',
          borderRadius: 2,
          color: 'primary.main',
          display: 'flex',
          flexShrink: 0,
          height: 42,
          justifyContent: 'center',
          width: 42,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 15, fontWeight: 900 }}>{label}</Typography>
        <Typography color="text.secondary" sx={{ fontSize: 12.5, lineHeight: 1.55, mt: 0.5 }}>
          {description}
        </Typography>
      </Box>
    </Paper>
  )
}

function ContinueCard({
  cta,
  meta,
  progress,
  subtitle,
  tag,
  title,
  to,
  tone = 'primary',
}: {
  cta: string
  meta: string
  progress: number
  subtitle: string
  tag: string
  title: string
  to: string
  tone?: 'primary' | 'accent'
}) {
  return (
    <Paper
      sx={{
        background:
          tone === 'accent'
            ? 'linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(15,118,110,0.06) 100%)'
            : 'linear-gradient(135deg, rgba(15,118,110,0.09) 0%, rgba(37,99,235,0.05) 100%)',
        borderRadius: 3,
        p: 3,
      }}
      variant="outlined"
    >
      <Typography sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 800, letterSpacing: 0.3, textTransform: 'uppercase' }}>
        {tag}
      </Typography>
      <Typography sx={{ fontSize: 28, fontWeight: 900, lineHeight: 1.2, mt: 1.5 }}>{title}</Typography>
      <Typography sx={{ color: 'text.secondary', mt: 1 }}>{subtitle}</Typography>
      <Typography color="text.secondary" sx={{ fontSize: 12, mt: 1 }} variant="body2">
        {meta}
      </Typography>
      <LinearProgress sx={{ borderRadius: 999, height: 8, mt: 2.5 }} value={Math.min(100, Math.max(0, progress))} variant="determinate" />
      <Button
        component={RouterLink}
        endIcon={<ArrowRightAltOutlinedIcon />}
        sx={{ mt: 2.5 }}
        to={to}
        variant={tone === 'accent' ? 'outlined' : 'contained'}
      >
        {cta}
      </Button>
    </Paper>
  )
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return 'Henüz yok'
  }

  return new Date(value).toLocaleString('tr-TR', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  })
}

function getStudyStatusLabel(status: number) {
  switch (status) {
    case 2:
      return 'Devam ediyor'
    case 3:
      return 'Çalışıldı'
    case 4:
      return 'Tekrar gerekli'
    case 5:
      return 'Tamamlandı'
    default:
      return 'Başlanmadı'
  }
}

function getGoalChipStyle(status: number) {
  switch (status) {
    case 2:
      return { bgcolor: 'rgba(15,118,110,0.08)', color: 'primary.main', fontWeight: 700 }
    case 4:
      return { bgcolor: '#fef3c7', color: '#b45309', fontWeight: 700 }
    case 5:
      return { bgcolor: '#dcfce7', color: '#166534', fontWeight: 700 }
    default:
      return { bgcolor: 'rgba(15,23,42,0.06)', color: 'text.secondary', fontWeight: 700 }
  }
}

function findContinueLearningProgress(program: StudentProgram) {
  if (!program.continueLearning) {
    return 0
  }

  const matchingLicense = program.licenses.find((license) => license.licenseId === program.continueLearning?.licenseId)
  return Number(matchingLicense?.progressPercentage || 0)
}

function findContinueTrialProgress(program: StudentProgram, analytics: StudentAnalytics | null) {
  if (!program.continueTrial) {
    return 0
  }

  const matchingTrial = analytics?.trialPerformances.find((trial) => trial.trialExamId === program.continueTrial?.trialExamId)
  return Number(matchingTrial?.successRate || 35)
}

function calculateStreak(dailyTrend?: StudentAnalytics['dailyTrend']) {
  if (!dailyTrend || dailyTrend.length === 0) {
    return 0
  }

  let streak = 0

  for (let index = dailyTrend.length - 1; index >= 0; index -= 1) {
    if ((dailyTrend[index]?.questionCount || 0) > 0) {
      streak += 1
      continue
    }

    break
  }

  return streak
}

function getDefaultQuizPath(mode?: UserDefaultQuizMode) {
  switch (mode) {
    case UserDefaultQuizMode.Course:
      return '/quiz/course-practice'
    case UserDefaultQuizMode.Topic:
      return '/quiz'
    case UserDefaultQuizMode.WrongAnswers:
      return '/quiz/wrong-answers'
    case UserDefaultQuizMode.TrialExam:
      return '/quizzes'
    default:
      return '/mixed-practice'
  }
}
