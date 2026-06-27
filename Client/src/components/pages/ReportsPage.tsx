import { type ReactNode, useEffect, useState } from 'react'
import AnalyticsOutlinedIcon from '@mui/icons-material/AnalyticsOutlined'
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined'
import TrendingDownOutlinedIcon from '@mui/icons-material/TrendingDownOutlined'
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined'
import { Alert, Box, LinearProgress, Paper, Skeleton, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router'
import type { ProgressTimelinePoint, StudentAnalytics } from '../../models'
import { api } from '../../shared/api'
import { EmptyState } from '../common/EmptyState'
import { StudentPageHero } from '../common/StudentPageHero'

export function ReportsPage() {
  const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadAnalytics() {
      setIsLoading(true)
      setError('')

      try {
        setAnalytics(await api.getStudentAnalytics())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Raporlar yüklenemedi.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadAnalytics()
  }, [])

  if (isLoading) {
    return (
      <Stack spacing={2}>
        <Skeleton height={220} variant="rounded" />
        <Skeleton height={140} variant="rounded" />
        <Skeleton height={320} variant="rounded" />
      </Stack>
    )
  }

  if (error && !analytics) {
    return <Alert severity="error">{error}</Alert>
  }

  if (!analytics) {
    return <EmptyState title="Rapor bulunamadı" description="İstatistik verileri şu anda alınamıyor." />
  }

  return (
    <Stack spacing={3}>
      <StudentPageHero
        eyebrow="Raporlar"
        title="Raporlar ve İstatistikler"
        description="Başarı oranını, çalışma yoğunluğunu ve hangi konularda güçlenmen gerektiğini tek ekranda izle."
        sideContent={
          <Paper sx={{ borderRadius: 3, p: 3 }} variant="outlined">
            <Stack spacing={1}>
              <Typography color="text.secondary" variant="body2">
                Genel başarı
              </Typography>
              <Typography sx={{ fontSize: 34, fontWeight: 900 }}>%{analytics.successRate}</Typography>
              <Typography color="text.secondary" variant="body2">
                {analytics.totalSolvedQuizzes} test · {analytics.totalSolvedQuestions} soru
              </Typography>
              <LinearProgress sx={{ borderRadius: 999, height: 10, mt: 1 }} value={Number(analytics.successRate)} variant="determinate" />
            </Stack>
          </Paper>
        }
      />

      {error && <Alert severity="error">{error}</Alert>}

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { lg: 'repeat(4, 1fr)', md: 'repeat(2, 1fr)', xs: '1fr' } }}>
        <MetricCard icon={<AnalyticsOutlinedIcon color="primary" />} label="Başarı Oranı" value={`%${analytics.successRate}`} />
        <MetricCard icon={<InsightsOutlinedIcon color="primary" />} label="Toplam Test" value={analytics.totalSolvedQuizzes.toString()} />
        <MetricCard icon={<TrendingUpOutlinedIcon color="success" />} label="Bugün Çözülen Soru" value={analytics.todaySolvedQuestions.toString()} />
        <MetricCard icon={<TrendingUpOutlinedIcon color="warning" />} label="Haftalık Çalışma" value={`${analytics.estimatedWeeklyStudyMinutes} dk`} />
      </Box>

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { lg: '1.4fr 1fr', xs: '1fr' } }}>
        <Paper sx={{ borderRadius: 3, p: 3 }} variant="outlined">
          <Typography variant="h2">Performans Trendleri</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Son dönem çalışma ritmini ve başarı değişimini takip et.
          </Typography>
          <Stack spacing={2} sx={{ mt: 3 }}>
            <TrendChart points={analytics.dailyTrend} title="Günlük görünüm" />
            <TrendChart points={analytics.weeklyTrend} title="Haftalık görünüm" />
          </Stack>
        </Paper>

        <Paper sx={{ borderRadius: 3, p: 3 }} variant="outlined">
          <Typography variant="h2">Deneme Performansı</Typography>
          {analytics.trialPerformances.length === 0 ? (
            <EmptyState title="Henüz deneme çözülmedi" description="İlk denemeni çözdüğünde burada skor geçmişi oluşacak." />
          ) : (
            <Stack spacing={2} sx={{ mt: 2 }}>
              {analytics.trialPerformances.slice(0, 5).map((trial) => (
                <Paper component={RouterLink} key={trial.attemptId} sx={{ borderRadius: 3, color: 'inherit', p: 2, textDecoration: 'none' }} to={`/trials/${trial.attemptId}`} variant="outlined">
                  <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'space-between' }}>
                    <Box>
                      <Typography sx={{ fontWeight: 700 }}>{trial.trialTitle}</Typography>
                      <Typography color="text.secondary" variant="body2">
                        {trial.correctCount} doğru · {trial.wrongCount} yanlış
                      </Typography>
                    </Box>
                    <Typography sx={{ fontWeight: 800 }}>%{trial.successRate}</Typography>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </Paper>
      </Box>

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { lg: '1fr 1fr', xs: '1fr' } }}>
        <TopicStrengthList
          description="Yüksek başarı oranına ulaştığın konular burada."
          emptyDescription="Henüz güçlü konu verisi oluşmadı."
          icon={<TrendingUpOutlinedIcon color="success" />}
          items={analytics.strongTopics}
          title="Güçlü Konular"
        />
        <TopicStrengthList
          description="Tekrar planına öncelik verebileceğin alanlar."
          emptyDescription="Henüz zayıf konu verisi oluşmadı."
          icon={<TrendingDownOutlinedIcon color="warning" />}
          items={analytics.weakTopics}
          title="Zayıf Konular"
        />
      </Box>
    </Stack>
  )
}

function MetricCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <Paper sx={{ borderRadius: 3, p: 2.5 }} variant="outlined">
      <Stack spacing={1.5}>
        <Box>{icon}</Box>
        <Typography color="text.secondary" variant="body2">
          {label}
        </Typography>
        <Typography sx={{ fontSize: 30, fontWeight: 800 }}>{value}</Typography>
      </Stack>
    </Paper>
  )
}

function TrendChart({ points, title }: { points: ProgressTimelinePoint[]; title: string }) {
  const maxQuestionCount = Math.max(...points.map((point) => point.questionCount), 1)

  if (points.length === 0) {
    return <EmptyState title={title} description="Henüz grafik oluşturacak kadar çalışma verisi yok." />
  }

  return (
    <Box>
      <Typography sx={{ fontWeight: 700, mb: 1.5 }}>{title}</Typography>
      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'flex-end', minHeight: 180, overflowX: 'auto' }}>
        {points.map((point) => (
          <Stack key={`${title}-${point.periodStart}`} spacing={1} sx={{ alignItems: 'center', minWidth: 56 }}>
            <Box
              sx={{
                alignItems: 'flex-end',
                bgcolor: '#dbeafe',
                borderRadius: 2,
                display: 'flex',
                height: Math.max(28, (point.questionCount / maxQuestionCount) * 120),
                justifyContent: 'center',
                px: 1,
                width: '100%',
              }}
            >
              <Typography sx={{ color: '#1d4ed8', fontSize: 12, fontWeight: 700, pb: 0.75 }}>{point.questionCount}</Typography>
            </Box>
            <Typography color="text.secondary" sx={{ fontSize: 12, textAlign: 'center' }}>
              {point.label}
            </Typography>
            <Typography sx={{ fontSize: 12, fontWeight: 700 }}>%{point.successRate}</Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  )
}

function TopicStrengthList({
  description,
  emptyDescription,
  icon,
  items,
  title,
}: {
  description: string
  emptyDescription: string
  icon: ReactNode
  items: StudentAnalytics['strongTopics']
  title: string
}) {
  return (
    <Paper sx={{ borderRadius: 3, p: 3 }} variant="outlined">
      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
        {icon}
        <Typography variant="h2">{title}</Typography>
      </Stack>
      <Typography color="text.secondary" sx={{ mt: 1 }}>
        {description}
      </Typography>

      {items.length === 0 ? (
        <EmptyState title={title} description={emptyDescription} />
      ) : (
        <Stack spacing={2} sx={{ mt: 2.5 }}>
          {items.map((item) => (
            <Paper component={RouterLink} key={item.topicId} sx={{ borderRadius: 3, color: 'inherit', p: 2, textDecoration: 'none' }} to={`/study/${item.topicId}`} variant="outlined">
              <Stack spacing={1}>
                <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between' }}>
                  <Box>
                    <Typography sx={{ fontWeight: 700 }}>{item.topicTitle}</Typography>
                    <Typography color="text.secondary" variant="body2">
                      {item.courseName}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontWeight: 800 }}>%{item.successRate}</Typography>
                </Stack>
                <LinearProgress sx={{ borderRadius: 999, height: 8 }} value={Number(item.successRate)} variant="determinate" />
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Paper>
  )
}
