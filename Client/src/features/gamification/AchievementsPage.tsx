import { useQuery } from '@tanstack/react-query'
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined'
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined'
import { Alert, Box, Button, Chip, LinearProgress, Paper, Skeleton, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router'
import { AccessDenied } from '../../components/common/AccessDenied'
import { StudentPageHero } from '../../components/common/StudentPageHero'
import { BadgeRequirementType, type UserBadge } from '../../models'
import { resolveApiAssetUrl } from '../../shared/api/assets'
import { ApiRequestError, gamificationApi } from '../../shared/api'

export function AchievementsPage() {
  const badgesQuery = useQuery({
    queryKey: ['gamification', 'badges'],
    queryFn: gamificationApi.getBadges,
    retry: 2,
  })

  if (badgesQuery.isLoading) {
    return (
      <Stack spacing={2}>
        <Skeleton height={180} variant="rounded" />
        <Skeleton height={420} variant="rounded" />
      </Stack>
    )
  }

  if (badgesQuery.isError) {
    if (badgesQuery.error instanceof ApiRequestError && badgesQuery.error.status === 403) {
      return <AccessDenied title="Rozet erişimi kapalı" message="Bu alan için öğrenci girişi gerekli." />
    }

    return <Alert severity="error">{badgesQuery.error instanceof Error ? badgesQuery.error.message : 'Rozetler yüklenemedi.'}</Alert>
  }

  const badges = badgesQuery.data ?? []
  const openBadgeTasks = badges
    .filter((badge) => !badge.unlocked && !badge.isHidden)
    .sort((first, second) => resolveCompletionRate(second) - resolveCompletionRate(first))
    .slice(0, 3)

  return (
    <Stack spacing={3}>
      <StudentPageHero
        eyebrow="Rozetler"
        title="Rozet koleksiyonun"
        description="Rozetleri sadece vitrin olarak değil, sıradaki çalışma görevleri olarak takip et."
      />

      {openBadgeTasks.length > 0 && (
        <Paper sx={{ borderRadius: 3, p: { md: 3, xs: 2.25 } }} variant="outlined">
          <Stack direction={{ md: 'row', xs: 'column' }} spacing={2.5} sx={{ justifyContent: 'space-between' }}>
            <Box>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <TaskAltOutlinedIcon color="primary" />
                <Typography sx={{ fontSize: 24, fontWeight: 900 }}>Sıradaki rozet görevleri</Typography>
              </Stack>
              <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
                En yakın tamamlanacak rozetleri seçip doğru çalışma alanına geç.
              </Typography>
            </Box>
          </Stack>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { md: 'repeat(3, 1fr)', xs: '1fr' }, mt: 2.5 }}>
            {openBadgeTasks.map((badge) => (
              <BadgeTaskCard badge={badge} key={badge.badgeId} />
            ))}
          </Box>
        </Paper>
      )}

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { lg: 'repeat(3, 1fr)', md: 'repeat(2, 1fr)', xs: '1fr' } }}>
        {badges.map((badge) => (
          <Paper
            key={badge.badgeId}
            sx={{
              borderRadius: 3,
              opacity: badge.unlocked ? 1 : 0.92,
              p: 3,
              position: 'relative',
            }}
            variant="outlined"
          >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
              {badge.unlocked || !badge.isHidden ? (
                <Box
                  alt=""
                  component="img"
                  src={resolveApiAssetUrl(badge.iconUrl)}
                  sx={{ height: 54, width: 54 }}
                />
              ) : (
                <Box
                  sx={{
                    alignItems: 'center',
                    bgcolor: 'rgba(15,23,42,0.08)',
                    borderRadius: '50%',
                    color: 'text.secondary',
                    display: 'flex',
                    fontSize: 24,
                    fontWeight: 900,
                    height: 54,
                    justifyContent: 'center',
                    width: 54,
                  }}
                >
                  ?
                </Box>
              )}
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <Chip
                  label={badge.unlocked ? 'Açıldı' : badge.isHidden ? 'Gizli' : 'Kilitli'}
                  sx={
                    badge.unlocked
                      ? { bgcolor: '#dcfce7', color: '#166534' }
                      : badge.isHidden
                        ? { bgcolor: 'rgba(15,23,42,0.08)', color: 'text.secondary' }
                        : undefined
                  }
                />
                <Chip label={`+${badge.xpReward} XP`} color="primary" variant="outlined" />
              </Stack>
            </Stack>
            <Typography sx={{ fontSize: 24, fontWeight: 900 }}>
              {badge.unlocked || !badge.isHidden ? badge.name : 'Gizli Rozet'}
            </Typography>
            <Typography color="text.secondary" sx={{ lineHeight: 1.8, mt: 1 }}>
              {badge.unlocked || !badge.isHidden ? badge.description : 'Şartlar tamamlanınca otomatik olarak görünür.'}
            </Typography>
            {!badge.unlocked && !badge.isHidden && (
              <Typography sx={{ color: 'primary.main', fontWeight: 800, mt: 1.5 }} variant="body2">
                Görev: {getBadgeAction(badge).task}
              </Typography>
            )}
            <LinearProgress
              sx={{ borderRadius: 999, height: 10, mt: 3 }}
              value={Math.min(100, Math.round((badge.progress / badge.requirementValue) * 100))}
              variant="determinate"
            />
            <Typography color="text.secondary" sx={{ display: 'block', fontSize: 12, mt: 1.25 }}>
              İlerleme: {badge.progress} / {badge.requirementValue}
            </Typography>
            {!badge.unlocked && !badge.isHidden && (
              <Button
                component={RouterLink}
                endIcon={<ArrowForwardOutlinedIcon />}
                sx={{ mt: 2 }}
                to={getBadgeAction(badge).path}
                variant="outlined"
              >
                {getBadgeAction(badge).label}
              </Button>
            )}
          </Paper>
        ))}
      </Box>
    </Stack>
  )
}

function BadgeTaskCard({ badge }: { badge: UserBadge }) {
  const action = getBadgeAction(badge)
  const remaining = Math.max(0, badge.requirementValue - badge.progress)
  const progress = Math.min(100, Math.round((badge.progress / badge.requirementValue) * 100))

  return (
    <Paper sx={{ borderRadius: 3, p: 2.5 }} variant="outlined">
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
          <Box
            alt=""
            component="img"
            src={resolveApiAssetUrl(badge.iconUrl)}
            sx={{ height: 42, width: 42 }}
          />
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 900 }}>{badge.name}</Typography>
            <Typography color="text.secondary" variant="caption">
              +{badge.xpReward} XP
            </Typography>
          </Box>
        </Stack>
        <Typography color="text.secondary" sx={{ lineHeight: 1.7 }} variant="body2">
          {action.task}
        </Typography>
        <Box>
          <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.75 }}>
            <Typography sx={{ fontWeight: 800 }} variant="body2">
              {badge.progress} / {badge.requirementValue}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {remaining} kaldı
            </Typography>
          </Stack>
          <LinearProgress sx={{ borderRadius: 999, height: 8 }} value={progress} variant="determinate" />
        </Box>
        <Button
          component={RouterLink}
          endIcon={<ArrowForwardOutlinedIcon />}
          to={action.path}
          variant="contained"
        >
          {action.label}
        </Button>
      </Stack>
    </Paper>
  )
}

function resolveCompletionRate(badge: UserBadge) {
  if (badge.requirementValue <= 0) {
    return 0
  }

  return badge.progress / badge.requirementValue
}

function getBadgeAction(badge: UserBadge) {
  switch (badge.requirementType) {
    case BadgeRequirementType.QuizCount:
      return {
        label: 'Quiz çöz',
        path: '/quizzes',
        task: `${Math.max(0, badge.requirementValue - badge.progress)} quiz daha tamamla.`,
      }
    case BadgeRequirementType.StreakDays:
      return {
        label: 'Bugünkü plana git',
        path: '/dashboard',
        task: `${Math.max(0, badge.requirementValue - badge.progress)} gün daha çalışma serisi oluştur.`,
      }
    case BadgeRequirementType.PerfectQuizCount:
      return {
        label: 'Pratik yap',
        path: '/mixed-practice',
        task: `${Math.max(0, badge.requirementValue - badge.progress)} quizi hatasız tamamlamaya çalış.`,
      }
    case BadgeRequirementType.LateNightStudyCount:
      return {
        label: 'Quiz seç',
        path: '/quizzes',
        task: `${Math.max(0, badge.requirementValue - badge.progress)} gece çalışması tamamla.`,
      }
    case BadgeRequirementType.ReviewQuestionCount:
      return {
        label: 'Tekrarlara git',
        path: '/reviews/today',
        task: `${Math.max(0, badge.requirementValue - badge.progress)} tekrar sorusu daha bitir.`,
      }
    case BadgeRequirementType.TotalXp:
      return {
        label: 'Günlük hedeflere git',
        path: '/gamification',
        task: `${Math.max(0, badge.requirementValue - badge.progress)} XP daha kazan.`,
      }
    case BadgeRequirementType.DailyGoalCompletionCount:
      return {
        label: 'Günlük hedefleri aç',
        path: '/gamification',
        task: `${Math.max(0, badge.requirementValue - badge.progress)} günlük hedef daha tamamla.`,
      }
    case BadgeRequirementType.TopicCompletionCount:
      return {
        label: 'Konulara git',
        path: '/my-topics',
        task: `${Math.max(0, badge.requirementValue - badge.progress)} konuyu tamamla.`,
      }
    case BadgeRequirementType.CourseCompletionCount:
      return {
        label: 'Derslere git',
        path: '/my-courses',
        task: `${Math.max(0, badge.requirementValue - badge.progress)} dersi tamamla.`,
      }
    default:
      return {
        label: 'Çalışmaya başla',
        path: '/dashboard',
        task: 'Çalışma etkinliğini sürdür.',
      }
  }
}
