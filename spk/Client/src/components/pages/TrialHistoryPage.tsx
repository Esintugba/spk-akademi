import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined'
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined'
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined'
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined'
import TrendingDownOutlinedIcon from '@mui/icons-material/TrendingDownOutlined'
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined'
import {
  Alert,
  Box,
  Button,
  Chip,
  InputAdornment,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState, type ReactNode } from 'react'
import { Link as RouterLink } from 'react-router'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { QuizMode, type QuizResultHistoryItem } from '../../models'
import { studentApi } from '../../shared/api'
import { EmptyState } from '../common/EmptyState'
import { StudentPageHero } from '../common/StudentPageHero'

type ModeFilter = 'all' | 'trial' | 'topic' | 'course' | 'mixed' | 'wrong' | 'review'
type ResultSort = 'date-desc' | 'date-asc' | 'score-desc' | 'score-asc' | 'duration-asc' | 'duration-desc'

export function TrialHistoryPage() {
  const [modeFilter, setModeFilter] = useState<ModeFilter>('all')
  const [courseId, setCourseId] = useState('')
  const [onlyWeak, setOnlyWeak] = useState(false)
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [minimumSuccess, setMinimumSuccess] = useState('')
  const [maximumSuccess, setMaximumSuccess] = useState('')
  const [sort, setSort] = useState<ResultSort>('date-desc')

  const historyQuery = useQuery({
    queryKey: ['student', 'result-history'],
    queryFn: studentApi.getResultHistory,
    staleTime: 30_000,
  })
  const attempts = useMemo(() => historyQuery.data ?? [], [historyQuery.data])
  const courseOptions = useMemo(
    () => Array.from(
      new Map(
        attempts
          .filter((attempt) => attempt.courseId && attempt.courseName)
          .map((attempt) => [attempt.courseId as string, attempt.courseName as string]),
      ),
      ([id, name]) => ({ id, name }),
    ).sort((left, right) => left.name.localeCompare(right.name, 'tr')),
    [attempts],
  )
  const filteredAttempts = useMemo(() => {
    const normalizedSearch = normalizeSearch(search)
    const minimumDate = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null
    const maximumDate = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : null
    const minimumScore = minimumSuccess === '' ? null : Number(minimumSuccess)
    const maximumScore = maximumSuccess === '' ? null : Number(maximumSuccess)

    return attempts
      .filter((attempt) => modeFilter === 'all' || resultModeGroup(attempt.mode) === modeFilter)
      .filter((attempt) => !courseId || attempt.courseId === courseId)
      .filter((attempt) => !onlyWeak || attempt.successRate < 60)
      .filter((attempt) => {
        if (!normalizedSearch) return true
        return normalizeSearch(
          `${attempt.title} ${attempt.courseName ?? ''} ${attempt.topicName ?? ''} ${modeLabel(attempt.mode)}`,
        ).includes(normalizedSearch)
      })
      .filter((attempt) => {
        const finishedAt = new Date(attempt.finishedAt).getTime()
        return (minimumDate == null || finishedAt >= minimumDate) &&
          (maximumDate == null || finishedAt <= maximumDate)
      })
      .filter((attempt) =>
        (minimumScore == null || attempt.successRate >= minimumScore) &&
        (maximumScore == null || attempt.successRate <= maximumScore))
      .sort((left, right) => compareResults(left, right, sort))
  }, [
    attempts,
    courseId,
    dateFrom,
    dateTo,
    maximumSuccess,
    minimumSuccess,
    modeFilter,
    onlyWeak,
    search,
    sort,
  ])
  const activeFilterCount = [
    search,
    modeFilter !== 'all' ? modeFilter : '',
    courseId,
    dateFrom,
    dateTo,
    minimumSuccess,
    maximumSuccess,
    onlyWeak ? 'weak' : '',
  ].filter(Boolean).length
  const summary = useMemo(() => buildPerformanceSummary(attempts), [attempts])
  const filteredSummary = useMemo(
    () => buildPerformanceSummary(filteredAttempts),
    [filteredAttempts],
  )
  const chartData = useMemo(
    () => buildResultChartData(filteredAttempts),
    [filteredAttempts],
  )

  function clearFilters() {
    setSearch('')
    setModeFilter('all')
    setCourseId('')
    setOnlyWeak(false)
    setDateFrom('')
    setDateTo('')
    setMinimumSuccess('')
    setMaximumSuccess('')
    setSort('date-desc')
  }

  if (historyQuery.isLoading) {
    return (
      <Stack spacing={2}>
        <Skeleton height={190} variant="rounded" />
        <Skeleton height={110} variant="rounded" />
        <Skeleton height={360} variant="rounded" />
      </Stack>
    )
  }

  if (historyQuery.isError) {
    return (
      <Stack spacing={2}>
        <Alert severity="error">
          {historyQuery.error instanceof Error ? historyQuery.error.message : 'Sonuç geçmişi yüklenemedi.'}
        </Alert>
        <Button onClick={() => void historyQuery.refetch()} variant="outlined">Tekrar dene</Button>
      </Stack>
    )
  }

  return (
    <Stack spacing={3} sx={{ minWidth: 0, width: '100%' }}>
      <StudentPageHero
        actions={
          <Button component={RouterLink} to="/my-trials" variant="outlined">
            Deneme kataloğu
          </Button>
        }
        eyebrow="Performans"
        title="Sonuçlarım"
        description="Tamamladığın tüm deneme, konu, ders, karma ve yanlış tekrar testlerini tek geçmişte incele."
        sideContent={
          <Paper sx={{ borderRadius: 3, p: 2.5 }} variant="outlined">
            <Typography color="text.secondary" sx={{ fontSize: 12, fontWeight: 800 }}>
              TAMAMLANAN TEST
            </Typography>
            <Typography sx={{ fontSize: 38, fontWeight: 900 }}>{attempts.length}</Typography>
            <Typography color="text.secondary" variant="body2">
              Ortalama başarı: %{summary.averageSuccess}
            </Typography>
          </Paper>
        }
      />

      <Box
        sx={{
          display: 'grid',
          gap: 1.5,
          gridTemplateColumns: {
            lg: 'repeat(3, minmax(0, 1fr))',
            sm: 'repeat(2, minmax(0, 1fr))',
            xs: 'minmax(0, 1fr)',
          },
          minWidth: 0,
          width: '100%',
        }}
      >
        <SummaryMetric
          detail={`${summary.testCount} tamamlanan test`}
          icon={<AssessmentOutlinedIcon color="primary" />}
          label="Ortalama başarı"
          value={`%${summary.averageSuccess}`}
        />
        <SummaryMetric
          detail={`${summary.correctCount} doğru · ${summary.wrongCount} yanlış`}
          icon={<QuizOutlinedIcon />}
          label="Toplam soru"
          value={String(summary.totalQuestions)}
        />
        <SummaryMetric
          detail={trendDescription(summary.weeklyTrend)}
          icon={trendIcon(summary.weeklyTrend)}
          label="Son 7 gün"
          tone={trendTone(summary.weeklyTrend)}
          value={formatTrend(summary.weeklyTrend)}
        />
        <SummaryMetric
          detail={trendDescription(summary.monthlyTrend)}
          icon={trendIcon(summary.monthlyTrend)}
          label="Son 30 gün"
          tone={trendTone(summary.monthlyTrend)}
          value={formatTrend(summary.monthlyTrend)}
        />
        <SummaryMetric
          detail={summary.strongestCourse ? `%${summary.strongestCourse.successRate} başarı` : 'Ders verisi yok'}
          icon={<TrendingUpOutlinedIcon color="success" />}
          label="En güçlü ders"
          value={summary.strongestCourse?.name ?? '-'}
        />
        <SummaryMetric
          detail={summary.weakestCourse ? `%${summary.weakestCourse.successRate} başarı` : 'Ders verisi yok'}
          icon={<TrendingDownOutlinedIcon color="warning" />}
          label="Geliştirilecek ders"
          value={summary.weakestCourse?.name ?? '-'}
        />
      </Box>

      <Paper sx={{ borderRadius: 3, p: 2 }} variant="outlined">
        <Stack
          direction={{ md: 'row', xs: 'column' }}
          spacing={2}
          sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between' }}
        >
          <Box>
            <Typography sx={{ fontWeight: 900 }}>
              {activeFilterCount > 0 ? 'Filtrelenmiş sonuç özeti' : 'Çalışma özeti'}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {filteredSummary.testCount} test · {filteredSummary.totalQuestions} soru · %{filteredSummary.averageSuccess} başarı
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
            <Chip
              icon={<TimerOutlinedIcon />}
              label={`Toplam süre: ${formatStudyDuration(filteredSummary.totalDurationSeconds)}`}
              variant="outlined"
            />
            <Chip
              color="success"
              icon={<CheckCircleOutlineOutlinedIcon />}
              label={`${filteredSummary.correctCount} doğru`}
              variant="outlined"
            />
            <Chip color="error" label={`${filteredSummary.wrongCount} yanlış`} variant="outlined" />
            <Chip label={`${filteredSummary.emptyCount} boş`} variant="outlined" />
          </Stack>
        </Stack>
      </Paper>

      <ResultPerformanceCharts data={chartData} resultCount={filteredAttempts.length} />

      <Paper sx={{ borderRadius: 3, p: 2 }} variant="outlined">
        <Stack spacing={1.5}>
          <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography sx={{ fontWeight: 900 }}>Sonuç filtreleri</Typography>
              <Chip label={`${filteredAttempts.length} / ${attempts.length} sonuç`} size="small" />
              {activeFilterCount > 0 && <Chip color="primary" label={`${activeFilterCount} aktif filtre`} size="small" />}
            </Stack>
            <Button
              disabled={activeFilterCount === 0 && sort === 'date-desc'}
              onClick={clearFilters}
              size="small"
              startIcon={<RestartAltOutlinedIcon />}
            >
              Temizle
            </Button>
          </Stack>

          <Box
            sx={{
              '& > *': { minWidth: 0, width: '100%' },
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: { lg: '2fr repeat(3, minmax(0, 1fr))', sm: 'repeat(2, minmax(0, 1fr))', xs: '1fr' },
            }}
          >
            <TextField
              label="Sonuçlarda ara"
              onChange={(event) => setSearch(event.target.value)}
              value={search}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlinedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              label="Test türü"
              onChange={(event) => setModeFilter(event.target.value as ModeFilter)}
              select
              value={modeFilter}
            >
              <MenuItem value="all">Tüm testler</MenuItem>
              <MenuItem value="trial">Denemeler</MenuItem>
              <MenuItem value="topic">Konu testleri</MenuItem>
              <MenuItem value="course">Ders testleri</MenuItem>
              <MenuItem value="mixed">Karışık testler</MenuItem>
              <MenuItem value="wrong">Yanlış tekrarları</MenuItem>
              <MenuItem value="review">Tekrar oturumları</MenuItem>
            </TextField>
            <TextField label="Ders" onChange={(event) => setCourseId(event.target.value)} select value={courseId}>
              <MenuItem value="">Tüm dersler</MenuItem>
              {courseOptions.map((course) => (
                <MenuItem key={course.id} value={course.id}>{course.name}</MenuItem>
              ))}
            </TextField>
            <TextField label="Sıralama" onChange={(event) => setSort(event.target.value as ResultSort)} select value={sort}>
              <MenuItem value="date-desc">Tarih: yeniden eskiye</MenuItem>
              <MenuItem value="date-asc">Tarih: eskiden yeniye</MenuItem>
              <MenuItem value="score-desc">Puan: yüksekten düşüğe</MenuItem>
              <MenuItem value="score-asc">Puan: düşükten yükseğe</MenuItem>
              <MenuItem value="duration-asc">Süre: kısadan uzuna</MenuItem>
              <MenuItem value="duration-desc">Süre: uzundan kısaya</MenuItem>
            </TextField>
          </Box>

          <Box
            sx={{
              '& > *': { minWidth: 0, width: '100%' },
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: { lg: 'repeat(5, minmax(0, 1fr))', sm: 'repeat(2, minmax(0, 1fr))', xs: '1fr' },
            }}
          >
            <TextField
              label="Başlangıç tarihi"
              onChange={(event) => setDateFrom(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              type="date"
              value={dateFrom}
            />
            <TextField
              label="Bitiş tarihi"
              onChange={(event) => setDateTo(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              type="date"
              value={dateTo}
            />
            <TextField
              label="En düşük başarı"
              onChange={(event) => setMinimumSuccess(event.target.value)}
              slotProps={{ htmlInput: { max: 100, min: 0 } }}
              type="number"
              value={minimumSuccess}
            />
            <TextField
              label="En yüksek başarı"
              onChange={(event) => setMaximumSuccess(event.target.value)}
              slotProps={{ htmlInput: { max: 100, min: 0 } }}
              type="number"
              value={maximumSuccess}
            />
            <Button
              color={onlyWeak ? 'warning' : 'inherit'}
              onClick={() => setOnlyWeak((current) => !current)}
              variant={onlyWeak ? 'contained' : 'outlined'}
            >
              Yalnızca zayıf sonuçlar
            </Button>
          </Box>
        </Stack>
      </Paper>

      {filteredAttempts.length === 0 ? (
        <EmptyState
          title={attempts.length === 0 ? 'Sonuç geçmişin henüz boş' : 'Filtrelere uygun sonuç yok'}
          description={attempts.length === 0
            ? 'İlk testini tamamladığında performans sonuçların burada görünecek.'
            : 'Test türü veya ders filtresini değiştirerek tekrar dene.'}
        />
      ) : (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { lg: 'repeat(2, minmax(0, 1fr))', xs: '1fr' } }}>
          {filteredAttempts.map((attempt) => <ResultHistoryCard attempt={attempt} key={attempt.attemptId} />)}
        </Box>
      )}
    </Stack>
  )
}

function SummaryMetric({
  detail,
  icon,
  label,
  tone = 'text.primary',
  value,
}: {
  detail?: string
  icon?: ReactNode
  label: string
  tone?: string
  value: string
}) {
  return (
    <Paper
      sx={{ borderRadius: 3, height: '100%', minWidth: 0, overflow: 'hidden', p: 2 }}
      variant="outlined"
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', minWidth: 0 }}>
        {icon}
        <Box sx={{ minWidth: 0 }}>
          <Typography color="text.secondary" variant="caption">{label}</Typography>
          <Typography
            color={tone}
            sx={{
              fontSize: 20,
              fontWeight: 900,
              lineHeight: 1.25,
              overflowWrap: 'anywhere',
            }}
            title={value}
          >
            {value}
          </Typography>
          {detail && (
            <Typography
              color="text.secondary"
              sx={{ display: 'block', mt: 0.5, overflowWrap: 'anywhere' }}
              title={detail}
              variant="caption"
            >
              {detail}
            </Typography>
          )}
        </Box>
      </Stack>
    </Paper>
  )
}

interface ResultChartData {
  timeline: { label: string; score: number; durationMinutes: number; title: string }[]
  modePerformance: { label: string; success: number; testCount: number }[]
  answerDistribution: { name: string; value: number; color: string }[]
}

function ResultPerformanceCharts({
  data,
  resultCount,
}: {
  data: ResultChartData
  resultCount: number
}) {
  if (resultCount === 0) return null

  return (
    <Stack spacing={2} sx={{ minWidth: 0, width: '100%' }}>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { lg: 'repeat(2, minmax(0, 1fr))', xs: 'minmax(0, 1fr)' },
          minWidth: 0,
        }}
      >
        <ChartCard title="Puan değişimi">
          {data.timeline.length < 2 ? (
            <ChartEmptyState message="Puan eğrisi için en az iki sonuç gerekli." />
          ) : (
            <ResponsiveContainer height={260} width="100%">
              <AreaChart data={data.timeline}>
                <defs>
                  <linearGradient id="resultScoreFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#0f766e" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#0f766e" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(148,163,184,0.2)" vertical={false} />
                <XAxis dataKey="label" minTickGap={20} tickLine={false} />
                <YAxis domain={[0, 100]} tickLine={false} />
                <Tooltip formatter={(value) => [`%${value}`, 'Başarı']} />
                <Area
                  dataKey="score"
                  fill="url(#resultScoreFill)"
                  name="Başarı"
                  stroke="#0f766e"
                  strokeWidth={3}
                  type="monotone"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Çözüm süresi trendi">
          {data.timeline.length < 2 ? (
            <ChartEmptyState message="Süre trendi için en az iki sonuç gerekli." />
          ) : (
            <ResponsiveContainer height={260} width="100%">
              <LineChart data={data.timeline}>
                <CartesianGrid stroke="rgba(148,163,184,0.2)" vertical={false} />
                <XAxis dataKey="label" minTickGap={20} tickLine={false} />
                <YAxis tickLine={false} />
                <Tooltip formatter={(value) => [`${value} dk`, 'Süre']} />
                <Line
                  dataKey="durationMinutes"
                  dot={{ fill: '#2563eb', r: 3 }}
                  name="Süre"
                  stroke="#2563eb"
                  strokeWidth={3}
                  type="monotone"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { lg: 'repeat(2, minmax(0, 1fr))', xs: 'minmax(0, 1fr)' },
          minWidth: 0,
        }}
      >
        <ChartCard title="Test türüne göre başarı">
          <ResponsiveContainer height={260} width="100%">
            <BarChart data={data.modePerformance}>
              <CartesianGrid stroke="rgba(148,163,184,0.2)" vertical={false} />
              <XAxis dataKey="label" interval={0} tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tickLine={false} />
              <Tooltip />
              <Bar dataKey="success" fill="#0f766e" name="Başarı %" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Cevap dağılımı">
          <ResponsiveContainer height={260} width="100%">
            <PieChart>
              <Pie
                data={data.answerDistribution}
                dataKey="value"
                innerRadius={58}
                nameKey="name"
                outerRadius={92}
                paddingAngle={3}
              >
                {data.answerDistribution.map((entry) => (
                  <Cell fill={entry.color} key={entry.name} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </Box>
    </Stack>
  )
}

function ChartCard({ children, title }: { children: ReactNode; title: string }) {
  return (
    <Paper
      sx={{ borderRadius: 3, minWidth: 0, overflow: 'hidden', p: 2.5, width: '100%' }}
      variant="outlined"
    >
      <Typography sx={{ fontWeight: 900, mb: 2 }}>{title}</Typography>
      {children}
    </Paper>
  )
}

function ChartEmptyState({ message }: { message: string }) {
  return (
    <Box sx={{ alignItems: 'center', display: 'flex', height: 260, justifyContent: 'center' }}>
      <Typography color="text.secondary" variant="body2">{message}</Typography>
    </Box>
  )
}

function ResultHistoryCard({ attempt }: { attempt: QuizResultHistoryItem }) {
  return (
    <Paper sx={{ borderRadius: 3, p: 2.5 }} variant="outlined">
      <Stack spacing={1.75}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 900 }}>{attempt.title}</Typography>
            <Typography color="text.secondary" variant="body2">
              {formatDate(attempt.finishedAt)} · {attempt.courseName ?? modeLabel(attempt.mode)}
            </Typography>
          </Box>
          <Chip color={attempt.successRate < 60 ? 'warning' : 'success'} label={`%${attempt.successRate}`} />
        </Stack>

        <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', rowGap: 0.75 }}>
          <Chip label={modeLabel(attempt.mode)} size="small" variant="outlined" />
          <Chip label={`${attempt.correctCount} doğru`} color="success" size="small" variant="outlined" />
          <Chip label={`${attempt.wrongCount} yanlış`} color="error" size="small" variant="outlined" />
          <Chip label={`${attempt.emptyCount} boş`} size="small" variant="outlined" />
          <Chip icon={<AccessTimeOutlinedIcon />} label={formatDuration(attempt.durationSeconds)} size="small" />
        </Stack>

        <Button
          component={RouterLink}
          endIcon={<ArrowForwardOutlinedIcon />}
          to={`/quiz/results/${attempt.attemptId}`}
          variant="contained"
        >
          Sonucu incele
        </Button>
      </Stack>
    </Paper>
  )
}

function resultModeGroup(mode: QuizMode): Exclude<ModeFilter, 'all'> {
  switch (mode) {
    case QuizMode.TopicPractice:
      return 'topic'
    case QuizMode.CoursePractice:
      return 'course'
    case QuizMode.MixedPractice:
    case QuizMode.PastExams:
      return 'mixed'
    case QuizMode.WrongAnswers:
      return 'wrong'
    case QuizMode.ReviewSession:
      return 'review'
    default:
      return 'trial'
  }
}

function modeLabel(mode: QuizMode) {
  switch (mode) {
    case QuizMode.TopicPractice:
      return 'Konu testi'
    case QuizMode.CoursePractice:
      return 'Ders testi'
    case QuizMode.MixedPractice:
      return 'Karışık test'
    case QuizMode.WrongAnswers:
      return 'Yanlış tekrarı'
    case QuizMode.ReviewSession:
      return 'Tekrar oturumu'
    case QuizMode.PastExams:
      return 'Çıkmış sorular'
    case QuizMode.FreeTrial:
      return 'Ücretsiz deneme'
    case QuizMode.LicensedQuiz:
      return 'Lisanslı deneme'
    case QuizMode.MockExam:
      return 'Deneme sınavı'
    default:
      return 'Deneme'
  }
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return minutes > 0 ? `${minutes} dk ${remainingSeconds} sn` : `${remainingSeconds} sn`
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function compareResults(
  left: QuizResultHistoryItem,
  right: QuizResultHistoryItem,
  sort: ResultSort,
) {
  switch (sort) {
    case 'date-asc':
      return new Date(left.finishedAt).getTime() - new Date(right.finishedAt).getTime()
    case 'score-desc':
      return right.successRate - left.successRate ||
        new Date(right.finishedAt).getTime() - new Date(left.finishedAt).getTime()
    case 'score-asc':
      return left.successRate - right.successRate ||
        new Date(right.finishedAt).getTime() - new Date(left.finishedAt).getTime()
    case 'duration-asc':
      return left.durationSeconds - right.durationSeconds
    case 'duration-desc':
      return right.durationSeconds - left.durationSeconds
    default:
      return new Date(right.finishedAt).getTime() - new Date(left.finishedAt).getTime()
  }
}

function normalizeSearch(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('tr-TR')
}

interface PerformanceSummary {
  testCount: number
  totalQuestions: number
  correctCount: number
  wrongCount: number
  emptyCount: number
  averageSuccess: number
  totalDurationSeconds: number
  weeklyTrend: number | null
  monthlyTrend: number | null
  strongestCourse: { name: string; successRate: number } | null
  weakestCourse: { name: string; successRate: number } | null
}

function buildPerformanceSummary(attempts: QuizResultHistoryItem[]): PerformanceSummary {
  const totalQuestions = attempts.reduce((total, attempt) => total + attempt.totalQuestions, 0)
  const correctCount = attempts.reduce((total, attempt) => total + attempt.correctCount, 0)
  const wrongCount = attempts.reduce((total, attempt) => total + attempt.wrongCount, 0)
  const emptyCount = attempts.reduce((total, attempt) => total + attempt.emptyCount, 0)
  const now = Date.now()

  return {
    testCount: attempts.length,
    totalQuestions,
    correctCount,
    wrongCount,
    emptyCount,
    averageSuccess: successRate(correctCount, totalQuestions),
    totalDurationSeconds: attempts.reduce((total, attempt) => total + attempt.durationSeconds, 0),
    weeklyTrend: periodTrend(attempts, now, 7),
    monthlyTrend: periodTrend(attempts, now, 30),
    ...courseStrengths(attempts),
  }
}

function buildResultChartData(attempts: QuizResultHistoryItem[]): ResultChartData {
  const chronological = attempts
    .slice()
    .sort((left, right) =>
      new Date(left.finishedAt).getTime() - new Date(right.finishedAt).getTime())
    .slice(-30)
  const modeGroups = new Map<string, {
    correctCount: number
    testCount: number
    totalQuestions: number
  }>()

  attempts.forEach((attempt) => {
    const label = modeLabel(attempt.mode)
    const current = modeGroups.get(label) ?? {
      correctCount: 0,
      testCount: 0,
      totalQuestions: 0,
    }
    current.correctCount += attempt.correctCount
    current.testCount += 1
    current.totalQuestions += attempt.totalQuestions
    modeGroups.set(label, current)
  })

  return {
    timeline: chronological.map((attempt) => ({
      label: shortDate(attempt.finishedAt),
      score: attempt.successRate,
      durationMinutes: Math.round((attempt.durationSeconds / 60) * 10) / 10,
      title: attempt.title,
    })),
    modePerformance: Array.from(modeGroups, ([label, group]) => ({
      label,
      success: successRate(group.correctCount, group.totalQuestions),
      testCount: group.testCount,
    })).sort((left, right) => right.success - left.success),
    answerDistribution: [
      {
        name: 'Doğru',
        value: attempts.reduce((total, attempt) => total + attempt.correctCount, 0),
        color: '#16a34a',
      },
      {
        name: 'Yanlış',
        value: attempts.reduce((total, attempt) => total + attempt.wrongCount, 0),
        color: '#dc2626',
      },
      {
        name: 'Boş',
        value: attempts.reduce((total, attempt) => total + attempt.emptyCount, 0),
        color: '#94a3b8',
      },
    ].filter((item) => item.value > 0),
  }
}

function periodTrend(attempts: QuizResultHistoryItem[], now: number, days: number) {
  const periodMs = days * 24 * 60 * 60 * 1000
  const current = attempts.filter((attempt) => {
    const time = new Date(attempt.finishedAt).getTime()
    return time >= now - periodMs && time <= now
  })
  const previous = attempts.filter((attempt) => {
    const time = new Date(attempt.finishedAt).getTime()
    return time >= now - (periodMs * 2) && time < now - periodMs
  })

  if (current.length === 0 || previous.length === 0) return null

  const currentQuestions = current.reduce((total, attempt) => total + attempt.totalQuestions, 0)
  const previousQuestions = previous.reduce((total, attempt) => total + attempt.totalQuestions, 0)
  const currentCorrect = current.reduce((total, attempt) => total + attempt.correctCount, 0)
  const previousCorrect = previous.reduce((total, attempt) => total + attempt.correctCount, 0)

  return Math.round((successRate(currentCorrect, currentQuestions) - successRate(previousCorrect, previousQuestions)) * 10) / 10
}

function courseStrengths(attempts: QuizResultHistoryItem[]) {
  const courses = new Map<string, { name: string; correct: number; total: number }>()

  attempts.forEach((attempt) => {
    if (!attempt.courseId || !attempt.courseName || attempt.totalQuestions === 0) return
    const current = courses.get(attempt.courseId) ?? {
      name: attempt.courseName,
      correct: 0,
      total: 0,
    }
    current.correct += attempt.correctCount
    current.total += attempt.totalQuestions
    courses.set(attempt.courseId, current)
  })

  const ranked = Array.from(courses.values())
    .map((course) => ({
      name: course.name,
      successRate: successRate(course.correct, course.total),
    }))
    .sort((left, right) => right.successRate - left.successRate)

  return {
    strongestCourse: ranked[0] ?? null,
    weakestCourse: ranked.length > 1 ? ranked[ranked.length - 1] : ranked[0] ?? null,
  }
}

function successRate(correct: number, total: number) {
  return total === 0 ? 0 : Math.round((correct / total) * 1000) / 10
}

function formatTrend(value: number | null) {
  if (value == null) return 'Veri yok'
  if (value === 0) return '%0'
  return `${value > 0 ? '+' : ''}%${value}`
}

function trendDescription(value: number | null) {
  if (value == null) return 'Önceki dönemle karşılaştırılamıyor'
  if (value > 0) return 'Başarı yükseldi'
  if (value < 0) return 'Başarı geriledi'
  return 'Başarı değişmedi'
}

function trendTone(value: number | null) {
  if (value == null || value === 0) return 'text.primary'
  return value > 0 ? 'success.main' : 'warning.main'
}

function trendIcon(value: number | null) {
  if (value == null || value === 0) return <AssessmentOutlinedIcon color="action" />
  return value > 0
    ? <TrendingUpOutlinedIcon color="success" />
    : <TrendingDownOutlinedIcon color="warning" />
}

function formatStudyDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.round((seconds % 3600) / 60)
  if (hours === 0) return `${minutes} dk`
  return `${hours} sa ${minutes} dk`
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(value))
}
