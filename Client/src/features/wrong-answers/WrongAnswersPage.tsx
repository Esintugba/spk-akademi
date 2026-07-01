import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined'
import ReplayOutlinedIcon from '@mui/icons-material/ReplayOutlined'
import TrendingDownOutlinedIcon from '@mui/icons-material/TrendingDownOutlined'
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Slider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { QuestionDifficulty } from '../../models/enums'
import { useWrongAnswerStore } from '../../stores/wrongAnswerStore'
import { EmptyState } from '../../components/common/EmptyState'
import { StudentPageHero } from '../../components/common/StudentPageHero'
import {
  useRemoveWrongAnswer,
  useStartWrongAnswersQuiz,
  useWrongAnswerFilterOptions,
  useWrongAnswerQueue,
  useWrongAnswerStats,
} from './hooks/useWrongAnswerQueries'

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function difficultyLabel(value: QuestionDifficulty) {
  switch (value) {
    case QuestionDifficulty.Easy:
      return 'Kolay'
    case QuestionDifficulty.Hard:
      return 'Zor'
    default:
      return 'Orta'
  }
}

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Paper sx={{ borderRadius: 3, p: 2.5 }} variant="outlined">
      <Typography color="text.secondary" variant="body2">
        {label}
      </Typography>
      <Typography sx={{ fontSize: 28, fontWeight: 900, mt: 0.5 }}>{value}</Typography>
      {hint && (
        <Typography color="text.secondary" variant="caption">
          {hint}
        </Typography>
      )}
    </Paper>
  )
}

export function WrongAnswersPage() {
  const { filters, setFilters } = useWrongAnswerStore()
  const [searchParams] = useSearchParams()
  const [startError, setStartError] = useState('')
  const queryCourseId = searchParams.get('courseId')
  const queryTopicId = searchParams.get('topicId')

  useEffect(() => {
    if (!queryCourseId && !queryTopicId) return

    setFilters({
      courseId: queryCourseId,
      topicId: queryTopicId,
      dueOnly: false,
    })
  }, [queryCourseId, queryTopicId, setFilters])

  const statsQuery = useWrongAnswerStats()
  const queueQuery = useWrongAnswerQueue(filters)
  const { courses, topics } = useWrongAnswerFilterOptions(filters.courseId)

  const queueItems = useMemo(
    () => queueQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [queueQuery.data],
  )

  const startMutation = useStartWrongAnswersQuiz({
    filters: {
      questionCount: filters.questionCount,
      courseId: filters.courseId,
      topicId: filters.topicId,
      difficulty: filters.difficulty,
    },
    onError: setStartError,
  })
  const removeMutation = useRemoveWrongAnswer()

  const filteredTopics = filters.courseId
    ? topics.filter((topic) => topic.courseId === filters.courseId)
    : topics

  const stats = statsQuery.data

  return (
    <Stack spacing={3}>
      <StudentPageHero
        eyebrow="Yanlışlarım"
        title="Yanlışlarım Test Modu"
        description="Yanlış yaptığın sorular aralıklı tekrar yöntemi ile tekrar kuyruğuna alınır. Zamanı gelenleri çözerek zayıf konularını güçlendir."
      />

      {statsQuery.isLoading ? (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { md: 'repeat(4, 1fr)', xs: '1fr 1fr' } }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height={100} variant="rounded" />
          ))}
        </Box>
      ) : stats ? (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { md: 'repeat(4, 1fr)', xs: '1fr 1fr' } }}>
          <StatCard label="Toplam yanlış" value={stats.totalWrongQuestions} />
          <StatCard label="Bugün tekrar" value={stats.dueForReview} hint="Tekrar zamanı gelen" />
          <StatCard label="Öğrenilen" value={stats.masteredQuestions} />
          <StatCard label="Haftalık başarı" value={`%${stats.weeklyAccuracy}`} hint={`Bugün: ${stats.todaySolved}`} />
        </Box>
      ) : null}

      {stats && stats.weakTopics.length > 0 && (
        <Paper sx={{ borderRadius: 3, p: 2.5 }} variant="outlined">
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.5 }}>
            <TrendingDownOutlinedIcon color="warning" fontSize="small" />
            <Typography sx={{ fontWeight: 800 }}>En çok yanlış yapılan konular</Typography>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            {stats.weakTopics.map((topic) => (
              <Chip
                key={topic.topicId}
                label={`${topic.courseName} · ${topic.topicTitle} (${topic.wrongCount})`}
                size="small"
                variant="outlined"
              />
            ))}
          </Stack>
        </Paper>
      )}

      <Paper sx={{ borderRadius: 3, p: 3 }} variant="outlined">
        <Typography sx={{ fontWeight: 800, mb: 2 }} variant="h6">
          Test başlat
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { md: 'repeat(4, 1fr)', xs: '1fr' },
            mb: 2,
          }}
        >
          <Box>
            <Typography gutterBottom variant="body2">
              Soru sayısı: {filters.questionCount}
            </Typography>
            <Slider
              max={100}
              min={5}
              onChange={(_, value) => setFilters({ questionCount: value as number })}
              step={5}
              value={filters.questionCount}
              valueLabelDisplay="auto"
            />
          </Box>
          <FormControl fullWidth size="small">
            <InputLabel>Ders</InputLabel>
            <Select
              label="Ders"
              onChange={(e) =>
                setFilters({ courseId: e.target.value || null, topicId: null })
              }
              value={filters.courseId ?? ''}
            >
              <MenuItem value="">Tümü</MenuItem>
              {courses.map((course) => (
                <MenuItem key={course.id} value={course.id}>
                  {course.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel>Konu</InputLabel>
            <Select
              disabled={!filters.courseId}
              label="Konu"
              onChange={(e) => setFilters({ topicId: e.target.value || null })}
              value={filters.topicId ?? ''}
            >
              <MenuItem value="">Tümü</MenuItem>
              {filteredTopics.map((topic) => (
                <MenuItem key={topic.id} value={topic.id}>
                  {topic.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel>Zorluk</InputLabel>
            <Select
              label="Zorluk"
              onChange={(e) =>
                setFilters({
                  difficulty: e.target.value ? (Number(e.target.value) as QuestionDifficulty) : null,
                })
              }
              value={filters.difficulty ?? ''}
            >
              <MenuItem value="">Tümü</MenuItem>
              <MenuItem value={QuestionDifficulty.Easy}>Kolay</MenuItem>
              <MenuItem value={QuestionDifficulty.Medium}>Orta</MenuItem>
              <MenuItem value={QuestionDifficulty.Hard}>Zor</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1.5}>
          <Button
            disabled={startMutation.isPending}
            onClick={() => {
              setStartError('')
              startMutation.mutate()
            }}
            startIcon={<PlayArrowOutlinedIcon />}
            variant="contained"
          >
            Tekrar Testi Başlat
          </Button>
          <Button
            disabled={startMutation.isPending || !stats?.dueForReview}
            onClick={() => {
              setFilters({ dueOnly: true })
              setStartError('')
              startMutation.mutate()
            }}
            startIcon={<ReplayOutlinedIcon />}
            variant="outlined"
          >
            Bugün Tekrar Edilecekleri Çöz
          </Button>
        </Stack>
        {startError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {startError}
          </Alert>
        )}
      </Paper>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }} variant="outlined">
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
          <Typography sx={{ fontWeight: 800 }}>Tekrar kuyruğu</Typography>
          <Chip
            label={filters.dueOnly ? 'Sadece vadesi gelenler' : 'Tüm kuyruk'}
            onClick={() => setFilters({ dueOnly: !filters.dueOnly })}
            size="small"
            variant={filters.dueOnly ? 'filled' : 'outlined'}
          />
        </Stack>

        {queueQuery.isLoading ? (
          <Stack spacing={1} sx={{ p: 2 }}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} height={48} />
            ))}
          </Stack>
        ) : queueItems.length === 0 ? (
          <Box sx={{ p: 3 }}>
            <EmptyState
              title="Kuyruk boş"
              description="Yanlış cevapladığın sorular otomatik olarak buraya eklenir. Quiz veya deneme çözdükçe kuyruk dolacaktır."
            />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Soru</TableCell>
                    <TableCell>Ders / Konu</TableCell>
                    <TableCell>Son yanlış</TableCell>
                    <TableCell>Sonraki tekrar</TableCell>
                    <TableCell>Başarı</TableCell>
                    <TableCell align="right">İşlem</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {queueItems.map((item) => (
                    <TableRow key={item.questionId} hover>
                      <TableCell>
                        <Typography variant="body2">{item.questionText}</Typography>
                        <Chip label={difficultyLabel(item.difficulty)} size="small" sx={{ mt: 0.5 }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{item.courseName}</Typography>
                        <Typography color="text.secondary" variant="caption">
                          {item.topicTitle}
                        </Typography>
                      </TableCell>
                      <TableCell>{formatDate(item.lastWrongAt)}</TableCell>
                      <TableCell>
                        {item.isMastered ? (
                          <Chip color="success" label="Öğrenildi" size="small" />
                        ) : (
                          formatDate(item.nextReviewAt)
                        )}
                      </TableCell>
                      <TableCell>%{item.successRate}</TableCell>
                      <TableCell align="right">
                        <Button
                          color="error"
                          disabled={removeMutation.isPending}
                          onClick={() => removeMutation.mutate(item.questionId)}
                          size="small"
                          startIcon={<DeleteOutlineOutlinedIcon />}
                          variant="text"
                        >
                          Kuyruktan Çıkar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {queueQuery.hasNextPage && (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Button
                  disabled={queueQuery.isFetchingNextPage}
                  onClick={() => void queueQuery.fetchNextPage()}
                  variant="outlined"
                >
                  {queueQuery.isFetchingNextPage ? 'Yükleniyor…' : 'Daha fazla yükle'}
                </Button>
              </Box>
            )}
          </>
        )}
      </Paper>

      {queueQuery.isError && (
        <Alert severity="error">
          {queueQuery.error instanceof Error ? queueQuery.error.message : 'Kuyruk yüklenemedi.'}
        </Alert>
      )}
    </Stack>
  )
}
