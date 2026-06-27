import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined'
import {
  Alert,
  Box,
  Chip,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { AccessDenied } from '../../components/common/AccessDenied'
import { StudentPageHero } from '../../components/common/StudentPageHero'
import { LeaderboardMetric, LeaderboardPeriod } from '../../models'
import { ApiRequestError, gamificationApi } from '../../shared/api'

export function LeaderboardPage() {
  const [period, setPeriod] = useState<LeaderboardPeriod>(LeaderboardPeriod.Weekly)
  const [metric, setMetric] = useState<LeaderboardMetric>(LeaderboardMetric.Xp)

  const leaderboardQuery = useQuery({
    queryKey: ['gamification', 'leaderboard', period, metric],
    queryFn: () => gamificationApi.getLeaderboard({ period, metric, top: 20 }),
    retry: 2,
  })

  const topThree = useMemo(() => (leaderboardQuery.data ?? []).slice(0, 3), [leaderboardQuery.data])

  return (
    <Stack spacing={3}>
      <StudentPageHero
        eyebrow="Liderlik Tablosu"
        title="Çalışmanın ritmi burada görünür."
        description="XP, çalışma serisi, başarı oranı ve çözülmüş soru metrikleriyle kendi yerini takip et."
        sideContent={
          <Stack spacing={1.5}>
            <ToggleButtonGroup
              color="primary"
              exclusive
              value={period}
              onChange={(_, value: LeaderboardPeriod | null) => value && setPeriod(value)}
            >
              <ToggleButton value={LeaderboardPeriod.Daily}>Günlük</ToggleButton>
              <ToggleButton value={LeaderboardPeriod.Weekly}>Haftalık</ToggleButton>
              <ToggleButton value={LeaderboardPeriod.Monthly}>Aylık</ToggleButton>
              <ToggleButton value={LeaderboardPeriod.Global}>Genel</ToggleButton>
            </ToggleButtonGroup>
            <ToggleButtonGroup
              color="primary"
              exclusive
              value={metric}
              onChange={(_, value: LeaderboardMetric | null) => value && setMetric(value)}
            >
              <ToggleButton value={LeaderboardMetric.Xp}>XP</ToggleButton>
              <ToggleButton value={LeaderboardMetric.Streak}>Seri</ToggleButton>
              <ToggleButton value={LeaderboardMetric.Accuracy}>Başarı</ToggleButton>
              <ToggleButton value={LeaderboardMetric.SolvedQuestions}>Soru</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        }
      />

      {leaderboardQuery.isLoading ? (
        <Skeleton height={360} variant="rounded" />
      ) : leaderboardQuery.isError ? (
        leaderboardQuery.error instanceof ApiRequestError && leaderboardQuery.error.status === 403 ? (
          <AccessDenied title="Liderlik tablosu erişimi kapalı" message="Bu alan yalnızca yetkili öğrenciler için açık." />
        ) : (
          <Alert severity="error">{leaderboardQuery.error instanceof Error ? leaderboardQuery.error.message : 'Liderlik tablosu yüklenemedi.'}</Alert>
        )
      ) : (
        <>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { md: 'repeat(3, 1fr)', xs: '1fr' } }}>
            {topThree.map((entry) => (
              <Paper key={entry.userId} sx={{ borderRadius: 3, p: 3 }} variant="outlined">
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.5 }}>
                  <EmojiEventsOutlinedIcon sx={{ color: entry.rank === 1 ? '#f59e0b' : '#94a3b8' }} />
                  <Typography sx={{ fontSize: 20, fontWeight: 900 }}>#{entry.rank}</Typography>
                </Stack>
                <Typography sx={{ fontSize: 22, fontWeight: 900 }}>{entry.displayName}</Typography>
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                  Seviye {entry.level}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mt: 2 }}>
                  <Chip label={`${entry.totalXp} XP`} color="primary" />
                  <Chip label={`${entry.currentStreak} gün seri`} />
                  <Chip label={`%${Math.round(entry.accuracy)} başarı`} />
                </Stack>
              </Paper>
            ))}
          </Box>

          <Paper sx={{ borderRadius: 3, overflow: 'hidden' }} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Sıra</TableCell>
                  <TableCell>Kullanıcı</TableCell>
                  <TableCell>Seviye</TableCell>
                  <TableCell>XP</TableCell>
                  <TableCell>Seri</TableCell>
                  <TableCell>Başarı</TableCell>
                  <TableCell>Çözülen</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(leaderboardQuery.data ?? []).map((entry) => (
                  <TableRow key={entry.userId} hover>
                    <TableCell>#{entry.rank}</TableCell>
                    <TableCell>{entry.displayName}</TableCell>
                    <TableCell>{entry.level}</TableCell>
                    <TableCell>{entry.totalXp}</TableCell>
                    <TableCell>{entry.currentStreak}</TableCell>
                    <TableCell>%{Math.round(entry.accuracy)}</TableCell>
                    <TableCell>{entry.solvedQuestions}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </>
      )}
    </Stack>
  )
}
