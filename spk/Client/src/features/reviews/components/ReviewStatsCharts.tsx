import { Paper, Stack, Typography } from '@mui/material'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { MasteryLevel, type ReviewStats } from '../../../models/review'

const masteryLabels: Record<MasteryLevel, string> = {
  [MasteryLevel.Beginner]: 'Başlangıç',
  [MasteryLevel.Intermediate]: 'Orta',
  [MasteryLevel.Advanced]: 'İleri',
  [MasteryLevel.Mastered]: 'Uzman',
}

interface ReviewStatsChartsProps {
  stats: ReviewStats
}

export function ReviewStatsCharts({ stats }: ReviewStatsChartsProps) {
  const masteryData = stats.masteryDistribution.map((item) => ({
    name: masteryLabels[item.level] ?? 'Diğer',
    count: item.count,
  }))

  const trendData = stats.dailyTrend.map((item) => ({
    date: item.date.slice(5),
    reviews: item.reviewCount,
    success: item.successRate,
  }))

  const weakTopics = stats.weakTopics.slice(0, 6).map((topic) => ({
    name: topic.topicTitle.length > 18 ? `${topic.topicTitle.slice(0, 18)}…` : topic.topicTitle,
    due: topic.dueCount,
    success: topic.successRate,
  }))

  return (
    <Stack spacing={2}>
      <Paper sx={{ borderRadius: 3, p: 2 }} variant="outlined">
        <Typography sx={{ fontWeight: 700, mb: 2 }} variant="subtitle1">
          Günlük tekrar trendi
        </Typography>
        <ResponsiveContainer height={220} width="100%">
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line dataKey="reviews" name="Tekrar" stroke="#0f766e" strokeWidth={2} type="monotone" />
            <Line dataKey="success" name="Başarı %" stroke="#1d4ed8" strokeWidth={2} type="monotone" />
          </LineChart>
        </ResponsiveContainer>
      </Paper>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <Paper sx={{ borderRadius: 3, flex: 1, p: 2 }} variant="outlined">
          <Typography sx={{ fontWeight: 700, mb: 2 }} variant="subtitle1">
            Ustalık dağılımı
          </Typography>
          <ResponsiveContainer height={220} width="100%">
            <BarChart data={masteryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#0f766e" name="Soru" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Paper>

        <Paper sx={{ borderRadius: 3, flex: 1, p: 2 }} variant="outlined">
          <Typography sx={{ fontWeight: 700, mb: 2 }} variant="subtitle1">
            Riskli alt konular
          </Typography>
          <ResponsiveContainer height={220} width="100%">
            <BarChart data={weakTopics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="due" fill="#dc2626" name="Vadesi gelen" radius={[6, 6, 0, 0]} />
              <Bar dataKey="success" fill="#f59e0b" name="Başarı %" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Stack>
    </Stack>
  )
}
