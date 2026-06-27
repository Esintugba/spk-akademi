import { useQuery } from '@tanstack/react-query'
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined'
import MilitaryTechOutlinedIcon from '@mui/icons-material/MilitaryTechOutlined'
import WhatshotOutlinedIcon from '@mui/icons-material/WhatshotOutlined'
import {
  Alert,
  Box,
  Chip,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { StudentPageHero } from '../../components/common/StudentPageHero'
import { AccessDenied } from '../../components/common/AccessDenied'
import type { UserBadge, XpTransaction } from '../../models'
import { ApiRequestError, gamificationApi } from '../../shared/api'
import { resolveApiAssetUrl } from '../../shared/api/assets'

export function GamificationPage() {
  const profileQuery = useQuery({
    queryKey: ['gamification', 'profile'],
    queryFn: gamificationApi.getProfile,
    retry: 2,
  })

  const badgesQuery = useQuery({
    queryKey: ['gamification', 'badges'],
    queryFn: gamificationApi.getBadges,
    retry: 2,
  })

  const goalsQuery = useQuery({
    queryKey: ['gamification', 'daily-goals'],
    queryFn: gamificationApi.getDailyGoals,
    retry: 2,
  })

  const xpHistoryQuery = useQuery({
    queryKey: ['gamification', 'xp-history'],
    queryFn: () => gamificationApi.getXpHistory({ page: 1, pageSize: 7 }),
    retry: 2,
  })

  if (profileQuery.isLoading) {
    return (
      <Stack spacing={2}>
        <Skeleton height={190} variant="rounded" />
        <Skeleton height={240} variant="rounded" />
        <Skeleton height={260} variant="rounded" />
      </Stack>
    )
  }

  if (profileQuery.isError || !profileQuery.data) {
    if (profileQuery.error instanceof ApiRequestError && profileQuery.error.status === 403) {
      return <AccessDenied title="Oyunlaştırma erişimi kapalı" message="Bu ekran için öğrenci yetkisi gerekiyor." />
    }

    return <Alert severity="error">{profileQuery.error instanceof Error ? profileQuery.error.message : 'Oyunlaştırma verisi yüklenemedi.'}</Alert>
  }

  const profile = profileQuery.data
  const badges = badgesQuery.data ?? []
  const dailyGoals = goalsQuery.data ?? []
  const xpHistory = xpHistoryQuery.data?.items ?? []

  return (
    <Stack spacing={3}>
      <StudentPageHero
        eyebrow="Oyunlaştırma"
        title="Çalış, XP kazan, seviyeni yükselt."
        description="Görevlerini tamamla, rozetlerini aç, çalışma serini koru ve liderlik tablosunda yukarı çık."
      />

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { lg: '1.2fr 0.8fr', xs: '1fr' } }}>
        <Paper sx={{ borderRadius: 3, p: 3 }} variant="outlined">
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography color="text.secondary" sx={{ fontSize: 13, fontWeight: 700 }}>
                Mevcut seviye
              </Typography>
              <Typography sx={{ fontSize: 40, fontWeight: 900, mt: 1 }}>Sv. {profile.level}</Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Chip icon={<BoltOutlinedIcon />} label={`${profile.totalXp} XP`} color="primary" />
              <Chip icon={<WhatshotOutlinedIcon />} label={`${profile.currentStreak} gün seri`} sx={{ bgcolor: '#fff7ed', color: '#c2410c' }} />
            </Stack>
          </Stack>
          <LinearProgress sx={{ borderRadius: 999, height: 12, mt: 3 }} value={profile.levelProgressPercentage} variant="determinate" />
          <Stack direction="row" sx={{ justifyContent: 'space-between', mt: 1.5 }}>
            <Typography color="text.secondary" variant="body2">
              Seviye içi XP: {profile.xp}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              Sonraki seviye: {profile.nextLevelXpThreshold} toplam XP
            </Typography>
          </Stack>
          <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { sm: 'repeat(4, 1fr)', xs: 'repeat(2, 1fr)' }, mt: 3 }}>
            <MetricTile label="Sıralama" value={`#${profile.rank}`} />
            <MetricTile label="Rozet" value={`${profile.unlockedBadgeCount}/${profile.totalBadgeCount}`} />
            <MetricTile label="Günlük hedef" value={`${profile.completedDailyGoalCount}`} />
            <MetricTile label="En uzun seri" value={`${profile.longestStreak} gün`} />
          </Box>
        </Paper>

        <Paper sx={{ borderRadius: 3, p: 3 }} variant="outlined">
          <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 2 }}>
            <MilitaryTechOutlinedIcon color="primary" />
            <Typography sx={{ fontSize: 22, fontWeight: 900 }}>Rozet Önizleme</Typography>
          </Stack>
          <Stack spacing={1.5}>
            {badges.slice(0, 4).map((badge) => (
              <BadgePreviewRow badge={badge} key={badge.badgeId} />
            ))}
          </Stack>
        </Paper>
      </Box>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { lg: '0.95fr 1.05fr', xs: '1fr' } }}>
        <Paper sx={{ borderRadius: 3, p: 3 }} variant="outlined">
          <Typography sx={{ fontSize: 22, fontWeight: 900, mb: 2 }}>Günlük Görevler</Typography>
          <Stack spacing={2}>
            {goalsQuery.isLoading && [1, 2, 3].map((item) => <Skeleton height={72} key={item} variant="rounded" />)}
            {!goalsQuery.isLoading && dailyGoals.map((goal) => (
              <Box key={goal.userDailyGoalId}>
                <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography sx={{ fontWeight: 800 }}>{goal.title}</Typography>
                    <Typography color="text.secondary" variant="body2">
                      {goal.description}
                    </Typography>
                  </Box>
                  <Chip
                    label={goal.completed ? 'Tamamlandı' : `+${goal.xpReward} XP`}
                    sx={goal.completed ? { bgcolor: '#dcfce7', color: '#166534' } : undefined}
                  />
                </Stack>
                <LinearProgress
                  sx={{ borderRadius: 999, height: 8, mt: 1.5 }}
                  value={Math.min(100, Math.round((goal.progress / goal.targetValue) * 100))}
                  variant="determinate"
                />
              </Box>
            ))}
          </Stack>
        </Paper>

        <Paper sx={{ borderRadius: 3, p: 3 }} variant="outlined">
          <Typography sx={{ fontSize: 22, fontWeight: 900, mb: 2 }}>XP Akışı</Typography>
          {xpHistoryQuery.isLoading ? (
            <Skeleton height={260} variant="rounded" />
          ) : (
            <ResponsiveContainer height={260} width="100%">
              <AreaChart data={toXpChartData(xpHistory)}>
                <defs>
                  <linearGradient id="xpFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.32} />
                    <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(148,163,184,0.2)" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="xp" stroke="#0f766e" fill="url(#xpFill)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Paper>
      </Box>
    </Stack>
  )
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ bgcolor: 'rgba(15,23,42,0.04)', borderRadius: 2.5, p: 2 }}>
      <Typography color="text.secondary" sx={{ fontSize: 12, fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 24, fontWeight: 900, mt: 0.75 }}>{value}</Typography>
    </Box>
  )
}

function BadgePreviewRow({ badge }: { badge: UserBadge }) {
  return (
    <Paper
      sx={{
        bgcolor: badge.unlocked ? 'rgba(20,184,166,0.08)' : 'rgba(15,23,42,0.04)',
        borderRadius: 2.5,
        p: 2,
      }}
      variant="outlined"
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', minWidth: 0 }}>
          {badge.unlocked || !badge.isHidden ? (
            <Box alt="" component="img" src={resolveApiAssetUrl(badge.iconUrl)} sx={{ height: 38, width: 38 }} />
          ) : (
            <Box
              sx={{
                alignItems: 'center',
                bgcolor: 'rgba(15,23,42,0.08)',
                borderRadius: '50%',
                color: 'text.secondary',
                display: 'flex',
                flex: '0 0 auto',
                fontWeight: 900,
                height: 38,
                justifyContent: 'center',
                width: 38,
              }}
            >
              ?
            </Box>
          )}
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 800 }}>{badge.unlocked || !badge.isHidden ? badge.name : 'Gizli Rozet'}</Typography>
            <Typography color="text.secondary" variant="body2">
              {badge.unlocked || !badge.isHidden ? badge.description : 'Açılınca detayları gösterilir.'}
            </Typography>
          </Box>
        </Stack>
        <Chip label={badge.unlocked ? 'Açıldı' : `${badge.progress}/${badge.requirementValue}`} size="small" />
      </Stack>
    </Paper>
  )
}

function toXpChartData(items: XpTransaction[]) {
  return [...items]
    .reverse()
    .map((item) => ({
      label: new Date(item.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }),
      xp: item.amount,
    }))
}
