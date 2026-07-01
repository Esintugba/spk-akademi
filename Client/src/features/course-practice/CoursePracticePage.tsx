import { useMutation, useQuery } from '@tanstack/react-query'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  Paper,
  Skeleton,
  Slider,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import type { Topic } from '../../models'
import { api, coursePracticeApi } from '../../shared/api'
import { useCoursePracticeStore } from '../../stores/coursePracticeStore'
import { EmptyState } from '../../components/common/EmptyState'
import { StudentPageHero } from '../../components/common/StudentPageHero'
import {
  coursePracticeSchema,
  toDifficultyLevels,
  type CoursePracticeFormValues,
} from './coursePracticeSchema'

const COURSES_KEY = ['course-practice', 'courses'] as const

const defaultValues: CoursePracticeFormValues = {
  courseId: '',
  questionCount: 25,
  difficultyEasy: true,
  difficultyMedium: true,
  difficultyHard: true,
  topicIds: [],
  includeWrongAnswered: true,
  randomizeQuestions: true,
  randomizeOptions: true,
}

export function CoursePracticePage() {
  const navigate = useNavigate()
  const setSession = useCoursePracticeStore((s) => s.setSession)
  const setLastFilters = useCoursePracticeStore((s) => s.setLastFilters)
  const lastFilters = useCoursePracticeStore((s) => s.lastFilters)

  const coursesQuery = useQuery({
    queryKey: COURSES_KEY,
    queryFn: () => coursePracticeApi.getCourses(),
    retry: 2,
  })

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CoursePracticeFormValues>({
    resolver: zodResolver(coursePracticeSchema),
    defaultValues: { ...defaultValues, ...lastFilters },
  })

  const courseId = watch('courseId')
  const questionCount = watch('questionCount')

  const [topics, setTopics] = useState<Topic[]>([])

  useEffect(() => {
    if (!courseId) {
      setTopics([])
      setValue('topicIds', [])
      return
    }

    void api.getTopics(courseId).then(setTopics).catch(() => setTopics([]))
  }, [courseId, setValue])

  const selectedCourse = useMemo(
    () => coursesQuery.data?.find((c) => c.courseId === courseId) ?? null,
    [courseId, coursesQuery.data],
  )

  const startMutation = useMutation({
    mutationFn: (values: CoursePracticeFormValues) => {
      const difficulties = toDifficultyLevels(values)
      return coursePracticeApi.startPractice({
        courseId: values.courseId,
        questionCount: values.questionCount,
        difficultyLevels: difficulties.length > 0 ? difficulties : undefined,
        topicIds: values.topicIds.length > 0 ? values.topicIds : undefined,
        includeWrongAnswered: values.includeWrongAnswered,
        randomizeQuestions: values.randomizeQuestions,
        randomizeOptions: values.randomizeOptions,
      })
    },
    onSuccess: (response) => {
      setSession(response.attemptId)
      navigate(`/quiz/course-practice/session/${response.attemptId}`)
    },
  })

  const onSubmit = handleSubmit((values) => {
    setLastFilters(values)
    startMutation.mutate(values)
  })

  if (coursesQuery.isLoading) {
    return (
      <Stack spacing={2}>
        <Skeleton height={160} variant="rounded" />
        <Skeleton height={320} variant="rounded" />
      </Stack>
    )
  }

  if (coursesQuery.isError) {
    return (
      <Stack spacing={2}>
        <Alert severity="error">
          {coursesQuery.error instanceof Error ? coursesQuery.error.message : 'Dersler yüklenemedi.'}
        </Alert>
        <Button onClick={() => void coursesQuery.refetch()} variant="outlined">
          Tekrar dene
        </Button>
      </Stack>
    )
  }

  const courses = coursesQuery.data ?? []

  return (
    <Stack spacing={3}>
      <StudentPageHero
        eyebrow="Ders Pratiği"
        title="Ders Bazlı Pratik Testi"
        description="Tek bir derse odaklan, filtreleri ayarla ve SPK çalışma akışına uygun deneme testi oluştur."
      />

      {courses.length === 0 ? (
        <EmptyState
          title="Erişilebilir ders yok"
          description="Lisans erişimin olan dersler burada listelenir."
        />
      ) : (
        <Paper component="form" onSubmit={onSubmit} sx={{ borderRadius: 3, p: 3 }} variant="outlined">
          <Stack spacing={3}>
            <Controller
              control={control}
              name="courseId"
              render={({ field }) => (
                <Autocomplete
                  onChange={(_, option) => field.onChange(option?.courseId ?? '')}
                  options={courses}
                  getOptionLabel={(option) => `${option.licenseName} · ${option.courseName}`}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      error={Boolean(errors.courseId)}
                      helperText={errors.courseId?.message}
                      label="Ders seç"
                    />
                  )}
                  value={courses.find((c) => c.courseId === field.value) ?? null}
                />
              )}
            />

            {selectedCourse && (
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                <Chip icon={<SchoolOutlinedIcon />} label={`${selectedCourse.totalQuestionCount} soru`} />
                <Chip label={`%${selectedCourse.successRate} başarı`} color="primary" variant="outlined" />
                <Chip label={`%${selectedCourse.progressPercentage} ilerleme`} variant="outlined" />
              </Stack>
            )}

            <Box>
              <Typography gutterBottom variant="body2">
                Soru sayısı: {questionCount}
              </Typography>
              <Controller
                control={control}
                name="questionCount"
                render={({ field }) => (
                  <Slider
                    max={100}
                    min={5}
                    onChange={(_, value) => field.onChange(value as number)}
                    step={5}
                    value={field.value}
                    valueLabelDisplay="auto"
                  />
                )}
              />
            </Box>

            <Stack spacing={1}>
              <Typography sx={{ fontWeight: 700 }} variant="subtitle2">
                Zorluk
              </Typography>
              <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
                <Controller
                  control={control}
                  name="difficultyEasy"
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Checkbox checked={field.value} onChange={field.onChange} />}
                      label="Kolay"
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="difficultyMedium"
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Checkbox checked={field.value} onChange={field.onChange} />}
                      label="Orta"
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="difficultyHard"
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Checkbox checked={field.value} onChange={field.onChange} />}
                      label="Zor"
                    />
                  )}
                />
              </Stack>
            </Stack>

            <Controller
              control={control}
              name="topicIds"
              render={({ field }) => (
                <Autocomplete
                  disabled={!courseId}
                  multiple
                  onChange={(_, value) => field.onChange(value.map((t) => t.id))}
                  options={topics}
                  getOptionLabel={(option) => option.title}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Konu filtreleri (opsiyonel)"
                      placeholder={courseId ? 'Tüm konular' : 'Önce ders seç'}
                    />
                  )}
                  value={topics.filter((t) => field.value.includes(t.id))}
                />
              )}
            />

            <Stack spacing={0.5}>
              <Controller
                control={control}
                name="includeWrongAnswered"
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox checked={field.value} onChange={field.onChange} />}
                    label="Yanlış yaptıklarımı önceliklendir"
                  />
                )}
              />
              <Controller
                control={control}
                name="randomizeQuestions"
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox checked={field.value} onChange={field.onChange} />}
                    label="Soruları karıştır"
                  />
                )}
              />
              <Controller
                control={control}
                name="randomizeOptions"
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox checked={field.value} onChange={field.onChange} />}
                    label="Şıkları karıştır"
                  />
                )}
              />
            </Stack>

            {startMutation.isError && (
              <Alert severity="error">
                {startMutation.error instanceof Error
                  ? startMutation.error.message
                  : 'Test başlatılamadı.'}
              </Alert>
            )}

            <Button disabled={startMutation.isPending} type="submit" variant="contained">
              {startMutation.isPending ? 'Oluşturuluyor…' : 'Ders Pratiğini Başlat'}
            </Button>
          </Stack>
        </Paper>
      )}
    </Stack>
  )
}
