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
import { ExamType, type PastExamAnalytics } from '../../models'

interface PastExamAnalyticsChartsProps {
  analytics: PastExamAnalytics
}

export function PastExamAnalyticsCharts({ analytics }: PastExamAnalyticsChartsProps) {
  const yearData = analytics.yearRates.map((x) => ({
    year: String(x.year),
    success: x.correctRate,
    total: x.totalSolved,
  }))

  const examTypeData = analytics.examTypeRates.map((x) => ({
    examType: ExamType[x.examType],
    success: x.correctRate,
    total: x.totalSolved,
  }))

  const weakTopics = analytics.weakTopics.map((x) => ({
    name: x.topicTitle.length > 18 ? `${x.topicTitle.slice(0, 18)}…` : x.topicTitle,
    success: x.correctRate,
    total: x.totalSolved,
  }))

  return (
    <Stack spacing={2}>
      <Paper sx={{ borderRadius: 3, p: 2 }} variant="outlined">
        <Typography sx={{ fontWeight: 800, mb: 2 }} variant="subtitle1">
          Yıl bazlı başarı
        </Typography>
        <ResponsiveContainer height={220} width="100%">
          <LineChart data={yearData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line dataKey="success" name="Başarı %" stroke="#f59e0b" strokeWidth={2} type="monotone" />
            <Line dataKey="total" name="Çözülen" stroke="#1d4ed8" strokeWidth={2} type="monotone" />
          </LineChart>
        </ResponsiveContainer>
      </Paper>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <Paper sx={{ borderRadius: 3, flex: 1, p: 2 }} variant="outlined">
          <Typography sx={{ fontWeight: 800, mb: 2 }} variant="subtitle1">
            Sınav türü başarı oranı
          </Typography>
          <ResponsiveContainer height={220} width="100%">
            <BarChart data={examTypeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="examType" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="success" name="Başarı %" fill="#0f766e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Paper>

        <Paper sx={{ borderRadius: 3, flex: 1, p: 2 }} variant="outlined">
          <Typography sx={{ fontWeight: 800, mb: 2 }} variant="subtitle1">
            En zayıf konular
          </Typography>
          <ResponsiveContainer height={220} width="100%">
            <BarChart data={weakTopics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="success" name="Başarı %" fill="#dc2626" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Stack>
    </Stack>
  )
}

