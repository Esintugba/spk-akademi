import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useRef } from 'react'
import { useNavigate } from 'react-router'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  ExamSession,
  ExamType,
  QuestionDifficulty,
  type PastExamQuestion,
  type StartPastExamQuizRequest,
  type Topic,
} from '../../models'
import { api } from '../../shared/api'
import { StudentPageHero } from '../../components/common/StudentPageHero'
import { usePastExamStore } from '../../stores/pastExamStore'
import { defaultPastExamsValues, pastExamsSchema, type PastExamsFormValues } from './pastExamsSchema'
import { PastExamAnalyticsCharts } from './PastExamAnalyticsCharts'

const QUESTIONS_KEY = ['past-exams', 'questions'] as const
const TOPICS_KEY = ['past-exams', 'topics'] as const
const ANALYTICS_KEY = ['past-exams', 'analytics'] as const

function formatExamLabel(item: PastExamQuestion) {
  const parts: string[] = []
  if (item.examYear) parts.push(String(item.examYear))
  if (item.examType != null) parts.push(ExamType[item.examType])
  if (item.examSession != null) parts.push(ExamSession[item.examSession])
  return parts.join(' ')
}

export function PastExamsPage() {
  const navigate = useNavigate()
  const lastFilters = usePastExamStore((s) => s.lastFilters)
  const setLastFilters = usePastExamStore((s) => s.setLastFilters)

  const topicsQuery = useQuery({
    queryKey: TOPICS_KEY,
    queryFn: () => api.getTopics(),
    retry: 2,
  })

  const analyticsQuery = useQuery({
    queryKey: ANALYTICS_KEY,
    queryFn: () => api.getPastExamAnalytics(),
    retry: 1,
  })

  const { control, handleSubmit, watch } = useForm<PastExamsFormValues>({
    resolver: zodResolver(pastExamsSchema),
    defaultValues: { ...defaultPastExamsValues, ...lastFilters },
  })

  const values = watch()
  const hasMeaningfulFilter = hasPastExamFilter(values)

  const questionsQuery = useInfiniteQuery({
    queryKey: [QUESTIONS_KEY, values],
    queryFn: ({ pageParam }) => {
      const examTypes = values.examTypes.length > 0 ? values.examTypes.map((x) => ExamType[x]).join(',') : undefined
      const years = values.years.length > 0 ? values.years.join(',') : undefined
      const session = values.session != null ? ExamSession[values.session] : undefined
      const topicIds = values.topicIds.length > 0 ? values.topicIds.join(',') : undefined
      return api.getPastExamQuestions({
        examTypes,
        years,
        session,
        topicIds,
        difficulty: values.difficulty ?? undefined,
        search: values.search.trim() || undefined,
        page: pageParam as number,
        pageSize: 20,
      })
    },
    initialPageParam: 1,
    enabled: hasMeaningfulFilter,
    getNextPageParam: (lastPage) => {
      const nextPage = lastPage.page + 1
      return nextPage * lastPage.pageSize <= lastPage.totalCount ? nextPage : undefined
    },
    retry: 1,
  })

  const flatItems = useMemo(() => questionsQuery.data?.pages.flatMap((p) => p.items) ?? [], [questionsQuery.data])

  const startQuizMutation = useMutation({
    mutationFn: (payload: StartPastExamQuizRequest) => api.startPastExamQuiz(payload),
    onSuccess: (response) => {
      navigate(`/quiz/session/${response.attemptId}`)
    },
  })

  const yearOptions = useMemo(() => {
    const now = new Date().getUTCFullYear()
    return Array.from({ length: now - 1990 + 1 }, (_, idx) => now - idx)
  }, [])

  const examTypeOptions = useMemo(
    () => Object.values(ExamType).filter((v) => typeof v === 'number') as unknown as ExamType[],
    [],
  )

  const sessionOptions = useMemo(
    () => Object.values(ExamSession).filter((v) => typeof v === 'number') as unknown as ExamSession[],
    [],
  )

  const difficultyOptions = useMemo(
    () =>
      Object.values(QuestionDifficulty).filter((v) => typeof v === 'number') as unknown as QuestionDifficulty[],
    [],
  )

  const topics = topicsQuery.data ?? []

  const onSubmit = handleSubmit((formValues) => {
    setLastFilters(formValues)
    startQuizMutation.mutate({
      examTypes: formValues.examTypes.length > 0 ? formValues.examTypes : undefined,
      years: formValues.years.length > 0 ? formValues.years : undefined,
      questionCount: formValues.questionCount,
      onlyPastExamQuestions: formValues.onlyPastExamQuestions,
      topicIds: formValues.topicIds.length > 0 ? formValues.topicIds : undefined,
      session: formValues.session ?? undefined,
      difficulty: formValues.difficulty ?? undefined,
      mixedYears: formValues.mixedYears,
    })
  })

  const parentRef = useRef<HTMLDivElement | null>(null)
  const rowVirtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 132,
    overscan: 8,
  })

  const totalCount = questionsQuery.data?.pages[0]?.totalCount ?? 0

  const reachedEnd = flatItems.length > 0 && flatItems.length >= totalCount
  const activeFilterCount = getActiveFilterCount(values)

  return (
    <Stack spacing={3}>
      <StudentPageHero
        eyebrow="Çıkmış Sorular"
        title="Yıl / Sınav filtresi ile çıkmış soru çalış."
        description="Çıkmış soru modunda filtrele, listele, test oluştur ve performansını takip et."
      />

      <Paper component="form" onSubmit={onSubmit} sx={{ borderRadius: 3, p: { md: 3, xs: 2 } }} variant="outlined">
        <Stack spacing={2.5}>
          <Stack
            direction={{ sm: 'row', xs: 'column' }}
            spacing={1.5}
            sx={{ alignItems: { sm: 'center', xs: 'flex-start' }, justifyContent: 'space-between' }}
          >
            <Box>
              <Typography sx={{ fontWeight: 900 }} variant="subtitle1">
                Filtre Paneli
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Liste ve test oluşturma aynı filtrelerle çalışır.
              </Typography>
            </Box>
            <Chip
              color={activeFilterCount > 0 ? 'primary' : 'default'}
              label={activeFilterCount > 0 ? `${activeFilterCount} aktif filtre` : 'Filtre seçilmedi'}
              size="small"
            />
          </Stack>

          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                lg: 'repeat(3, minmax(0, 1fr))',
                sm: 'repeat(2, minmax(0, 1fr))',
                xs: '1fr',
              },
            }}
          >
            <Controller
              control={control}
              name="examTypes"
              render={({ field }) => (
                <Autocomplete
                  fullWidth
                  multiple
                  options={examTypeOptions}
                  getOptionLabel={(option) => ExamType[option]}
                  value={field.value}
                  onChange={(_, value) => field.onChange(value)}
                  renderInput={(params) => <TextField {...params} label="Sınav türü" placeholder="Seç" />}
                />
              )}
            />

            <Controller
              control={control}
              name="years"
              render={({ field }) => (
                <Autocomplete
                  fullWidth
                  multiple
                  options={yearOptions}
                  value={field.value}
                  onChange={(_, value) => field.onChange(value)}
                  renderInput={(params) => <TextField {...params} label="Yıl" placeholder="Seç" />}
                />
              )}
            />

            <Controller
              control={control}
              name="session"
              render={({ field }) => (
                <Autocomplete
                  fullWidth
                  options={sessionOptions}
                  getOptionLabel={(option) => ExamSession[option]}
                  value={field.value}
                  onChange={(_, value) => field.onChange(value)}
                  renderInput={(params) => <TextField {...params} label="Oturum" placeholder="Opsiyonel" />}
                />
              )}
            />
            <Controller
              control={control}
              name="topicIds"
              render={({ field }) => (
                <Autocomplete
                  fullWidth
                  multiple
                  loading={topicsQuery.isLoading}
                  options={topics}
                  getOptionLabel={(option: Topic) => option.title}
                  value={topics.filter((t) => field.value.includes(t.id))}
                  onChange={(_, value) => field.onChange(value.map((t) => t.id))}
                  renderInput={(params) => <TextField {...params} label="Konu" placeholder="Opsiyonel" />}
                />
              )}
            />

            <Controller
              control={control}
              name="difficulty"
              render={({ field }) => (
                <Autocomplete
                  fullWidth
                  options={difficultyOptions}
                  getOptionLabel={(option) =>
                    option === QuestionDifficulty.Easy ? 'Kolay' : option === QuestionDifficulty.Medium ? 'Orta' : 'Zor'
                  }
                  value={field.value}
                  onChange={(_, value) => field.onChange(value)}
                  renderInput={(params) => <TextField {...params} label="Zorluk" placeholder="Opsiyonel" />}
                />
              )}
            />
            <Controller
              control={control}
              name="search"
              render={({ field }) => <TextField {...field} fullWidth label="Arama" placeholder="Soru metni / kaynak / konu" />}
            />

            <Controller
              control={control}
              name="questionCount"
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Soru sayısı"
                  type="number"
                  slotProps={{ htmlInput: { min: 5, max: 100 } }}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              )}
            />
          </Box>

          {startQuizMutation.isError && (
            <Alert severity="error">
              {startQuizMutation.error instanceof Error ? startQuizMutation.error.message : 'Test başlatılamadı.'}
            </Alert>
          )}

          <Button
            disabled={startQuizMutation.isPending}
            sx={{ alignSelf: { sm: 'flex-start', xs: 'stretch' }, minWidth: { sm: 240, xs: 0 } }}
            type="submit"
            variant="contained"
          >
            {startQuizMutation.isPending ? 'Oluşturuluyor…' : 'Çıkmış Sorulardan Test Oluştur'}
          </Button>

          <Typography color="text.secondary" variant="body2">
            Başlamak için en az bir filtre seç: sınav türü, yıl, oturum, konu, zorluk veya arama.
          </Typography>
        </Stack>
      </Paper>

      <Divider />

      <Stack spacing={2}>
        <Typography sx={{ fontWeight: 800 }} variant="subtitle1">
          Analizler
        </Typography>
        {analyticsQuery.isLoading && <Skeleton height={320} variant="rounded" />}
        {analyticsQuery.isError && (
          <Alert severity="error">
            {analyticsQuery.error instanceof Error ? analyticsQuery.error.message : 'Analizler yüklenemedi.'}
          </Alert>
        )}
        {analyticsQuery.data && <PastExamAnalyticsCharts analytics={analyticsQuery.data} />}
      </Stack>

      <Divider />

      <Stack spacing={2}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ fontWeight: 800 }} variant="subtitle1">
            Çıkmış Soru Listesi
          </Typography>
          <Chip
            color="warning"
            label={`${flatItems.length}/${totalCount || 0}`}
            variant="outlined"
          />
        </Stack>

        {!hasMeaningfulFilter && (
          <Alert severity="info">
            Çıkmış soruları listelemek için filtre panelinden en az bir kriter seç.
          </Alert>
        )}

        {hasMeaningfulFilter && questionsQuery.isLoading && <Skeleton height={320} variant="rounded" />}

        {hasMeaningfulFilter && questionsQuery.isError && (
          <Alert severity="error">
            {questionsQuery.error instanceof Error ? questionsQuery.error.message : 'Sorular yüklenemedi.'}
          </Alert>
        )}

        {hasMeaningfulFilter && !questionsQuery.isLoading && !questionsQuery.isError && (
          <Paper variant="outlined" sx={{ borderRadius: 3 }}>
            <Box ref={parentRef} sx={{ height: 560, overflow: 'auto' }}>
              <Box sx={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}>
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const item = flatItems[virtualRow.index]
                  if (!item) return null
                  return (
                    <Box
                      key={item.id}
                      sx={{
                        left: 0,
                        position: 'absolute',
                        top: 0,
                        transform: `translateY(${virtualRow.start}px)`,
                        width: '100%',
                        p: 2,
                      }}
                    >
                      <Stack spacing={1}>
                        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                          <Chip color="warning" label="Çıkmış Soru" size="small" />
                          <Chip label={formatExamLabel(item) || 'Sınav bilgisi yok'} size="small" variant="outlined" />
                          <Chip label={item.topicTitle} size="small" variant="outlined" />
                        </Stack>
                        <Typography sx={{ fontWeight: 800 }} variant="body1">
                          {item.text}
                        </Typography>
                        {item.sourceReference && (
                          <Typography color="text.secondary" variant="body2">
                            {item.sourceReference}
                          </Typography>
                        )}
                      </Stack>
                    </Box>
                  )
                })}
              </Box>
            </Box>

            <Divider />

            <Box sx={{ p: 2 }}>
              <Button
                disabled={questionsQuery.isFetchingNextPage || reachedEnd}
                onClick={() => void questionsQuery.fetchNextPage()}
                variant="outlined"
              >
                {reachedEnd ? 'Bitti' : questionsQuery.isFetchingNextPage ? 'Yükleniyor…' : 'Daha fazla yükle'}
              </Button>
            </Box>
          </Paper>
        )}
      </Stack>
    </Stack>
  )
}

function hasPastExamFilter(values: PastExamsFormValues) {
  return (
    values.examTypes.length > 0 ||
    values.years.length > 0 ||
    values.session != null ||
    values.topicIds.length > 0 ||
    values.difficulty != null ||
    values.search.trim().length > 0
  )
}

function getActiveFilterCount(values: PastExamsFormValues) {
  return [
    values.examTypes.length > 0,
    values.years.length > 0,
    values.session != null,
    values.topicIds.length > 0,
    values.difficulty != null,
    values.search.trim().length > 0,
  ].filter(Boolean).length
}
