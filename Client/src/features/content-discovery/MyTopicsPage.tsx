import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined'
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined'
import ExpandLessOutlinedIcon from '@mui/icons-material/ExpandLessOutlined'
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined'
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined'
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined'
import LibraryBooksOutlinedIcon from '@mui/icons-material/LibraryBooksOutlined'
import NoteAltOutlinedIcon from '@mui/icons-material/NoteAltOutlined'
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined'
import PlaylistAddCheckOutlinedIcon from '@mui/icons-material/PlaylistAddCheckOutlined'
import ReplayOutlinedIcon from '@mui/icons-material/ReplayOutlined'
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import StarBorderOutlinedIcon from '@mui/icons-material/StarBorderOutlined'
import StarOutlinedIcon from '@mui/icons-material/StarOutlined'
import TrendingDownOutlinedIcon from '@mui/icons-material/TrendingDownOutlined'
import ViewListOutlinedIcon from '@mui/icons-material/ViewListOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import { Link as RouterLink } from 'react-router'
import { toast } from 'react-toastify'
import { EmptyState } from '../../components/common/EmptyState'
import { StudentPageHero } from '../../components/common/StudentPageHero'
import { StudyStatus, TopicType } from '../../models'
import type { Course, CourseProgress, CourseTopicProgress, Topic, TopicPreference } from '../../models'
import { topicPreferencesApi } from '../../shared/api'
import { studentContentQueryKeys, useMyTopicsData } from './hooks/useStudentContentDiscovery'

interface MainTopicGroup {
  mainTopic: Topic
  subTopics: Topic[]
}

interface CourseTopicGroup {
  course: Course
  mainTopicGroups: MainTopicGroup[]
  orphanSubTopics: Topic[]
  topicCount: number
}

type TopicFilter = '' | 'needs-review' | 'weak' | 'incomplete' | 'mastered'
type TopicSort = 'curriculum' | 'priority' | 'success-asc' | 'recent'
type PreferenceFilter = '' | 'favorite' | 'weekly'
type TopicViewMode = 'cards' | 'compact'

const topicViewModeStorageKey = 'spk.myTopics.viewMode'

export function MyTopicsPage() {
  const queryClient = useQueryClient()
  const {
    courses,
    topics,
    isLoading,
    isError,
    error,
    progressByCourseId,
    isProgressLoading,
    progressErrorCount,
    progressOverview,
    isProgressOverviewLoading,
    isProgressOverviewError,
    topicPreferences,
    isTopicPreferencesLoading,
  } = useMyTopicsData()
  const [search, setSearch] = useState('')
  const [courseId, setCourseId] = useState('')
  const [topicFilter, setTopicFilter] = useState<TopicFilter>('')
  const [topicSort, setTopicSort] = useState<TopicSort>('curriculum')
  const [onlyWithQuestions, setOnlyWithQuestions] = useState(false)
  const [preferenceFilter, setPreferenceFilter] = useState<PreferenceFilter>('')
  const [collapsedCourseIds, setCollapsedCourseIds] = useState<Set<string>>(new Set())
  const [collapsedMainTopicIds, setCollapsedMainTopicIds] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<TopicViewMode>(() => readTopicViewMode())
  const [previewTopic, setPreviewTopic] = useState<Topic | null>(null)

  const courseById = useMemo(() => new Map(courses.map((course) => [course.id, course])), [courses])
  const preferenceByTopicId = useMemo(
    () => new Map(topicPreferences.map((preference) => [preference.topicId, preference])),
    [topicPreferences],
  )
  const topicOrderById = useMemo(() => new Map(topics.map((topic, index) => [topic.id, index])), [topics])
  const recommendedTopic = useMemo(
    () => findRecommendedTopic(courses, topics, progressByCourseId),
    [courses, progressByCourseId, topics],
  )
  const recentActivity = progressOverview?.recentActivities[0]
  const upcomingReview = progressOverview?.upcomingReviews[0]
  const activeFilterCount = [search, courseId, topicFilter, preferenceFilter, onlyWithQuestions ? 'questions' : ''].filter(Boolean).length
  const favoriteTopicCount = topicPreferences.filter((preference) => preference.isFavorite).length
  const weeklyTopicCount = topicPreferences.filter((preference) => preference.isInWeeklyPlan).length

  const preferenceMutation = useMutation({
    mutationFn: ({
      topicId,
      update,
    }: {
      topicId: string
      update: { isFavorite?: boolean; isInWeeklyPlan?: boolean }
    }) => topicPreferencesApi.update(topicId, update),
    onMutate: async ({ topicId, update }) => {
      await queryClient.cancelQueries({ queryKey: studentContentQueryKeys.topicPreferences })
      const previous = queryClient.getQueryData<TopicPreference[]>(studentContentQueryKeys.topicPreferences) ?? []
      const current = previous.find((preference) => preference.topicId === topicId)
      const next = {
        topicId,
        isFavorite: update.isFavorite ?? current?.isFavorite ?? false,
        isInWeeklyPlan: update.isInWeeklyPlan ?? current?.isInWeeklyPlan ?? false,
        updatedAt: new Date().toISOString(),
      }
      queryClient.setQueryData<TopicPreference[]>(
        studentContentQueryKeys.topicPreferences,
        [
          ...previous.filter((preference) => preference.topicId !== topicId),
          ...(next.isFavorite || next.isInWeeklyPlan ? [next] : []),
        ],
      )
      return { previous }
    },
    onError: (error, _, context) => {
      queryClient.setQueryData(studentContentQueryKeys.topicPreferences, context?.previous)
      toast.error(error instanceof Error ? error.message : 'Konu tercihi güncellenemedi.')
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: studentContentQueryKeys.topicPreferences }),
  })

  useEffect(() => {
    window.localStorage.setItem(topicViewModeStorageKey, viewMode)
  }, [viewMode])

  const filteredCourseGroups = useMemo<CourseTopicGroup[]>(() => {
    const normalizedSearch = search.trim().toLowerCase()
    const matchesSearch = (topic: Topic) => {
      if (!normalizedSearch) return true

      const course = courseById.get(topic.courseId)
      return `${topic.title} ${topic.parentTopicTitle ?? ''} ${course?.name ?? ''} ${topic.summary ?? ''}`.toLowerCase().includes(normalizedSearch)
    }
    const matchesProgressFilter = (topic: Topic) => {
      if (onlyWithQuestions && topic.questionCount === 0) return false
      const preference = preferenceByTopicId.get(topic.id)
      if (preferenceFilter === 'favorite' && !preference?.isFavorite) return false
      if (preferenceFilter === 'weekly' && !preference?.isInWeeklyPlan) return false
      if (!topicFilter) return true

      const progress = findTopicProgress(progressByCourseId.get(topic.courseId)?.topics, topic.id)
      const status = progress?.status ?? StudyStatus.NotStarted
      const answeredCount = (progress?.correctCount ?? 0) + (progress?.wrongCount ?? 0)

      switch (topicFilter) {
        case 'needs-review':
          return status === StudyStatus.NeedsReview
        case 'weak':
          return answeredCount > 0 && (progress?.successRate ?? 0) < 60
        case 'incomplete':
          return status !== StudyStatus.Studied && status !== StudyStatus.Mastered
        case 'mastered':
          return status === StudyStatus.Mastered
        default:
          return true
      }
    }
    const compareTopics = (left: Topic, right: Topic) =>
      compareTopicsByMode(
        left,
        right,
        topicSort,
        progressByCourseId.get(left.courseId),
        topicOrderById,
      )

    const selectedCourses = courses
      .filter((course) => !courseId || course.id === courseId)
      .sort((left, right) => left.order - right.order)

    return selectedCourses
      .map((course) => {
        const courseTopics = topics
          .filter((topic) => topic.courseId === course.id)
          .sort(compareTopics)

        const mainTopics = courseTopics.filter((topic) => topic.type === TopicType.MainTopic || !topic.parentTopicId)
        const mainTopicIds = new Set(mainTopics.map((topic) => topic.id))
        const subTopics = courseTopics.filter((topic) => topic.type === TopicType.SubTopic || topic.parentTopicId)
        const subTopicsByParent = new Map<string, Topic[]>()
        const orphanSubTopics: Topic[] = []

        for (const subTopic of subTopics) {
          if (subTopic.parentTopicId && mainTopicIds.has(subTopic.parentTopicId)) {
            const items = subTopicsByParent.get(subTopic.parentTopicId) ?? []
            items.push(subTopic)
            subTopicsByParent.set(subTopic.parentTopicId, items)
          } else {
            orphanSubTopics.push(subTopic)
          }
        }

        const mainTopicGroups = mainTopics
          .map((mainTopic) => {
            const children = subTopicsByParent.get(mainTopic.id) ?? []
            const mainTopicMatches = matchesSearch(mainTopic)
            const mainTopicMatchesFilters = mainTopicMatches && matchesProgressFilter(mainTopic)
            const matchingChildren = children
              .filter((child) => matchesSearch(child) && matchesProgressFilter(child))
              .sort(compareTopics)

            if (!mainTopicMatchesFilters && matchingChildren.length === 0) {
              return null
            }

            return {
              mainTopic,
              subTopics: mainTopicMatchesFilters
                ? children.filter(matchesProgressFilter).sort(compareTopics)
                : matchingChildren,
            }
          })
          .filter((group): group is MainTopicGroup => Boolean(group))
          .sort((left, right) => compareTopics(left.mainTopic, right.mainTopic))

        const visibleOrphanSubTopics = orphanSubTopics
          .filter((topic) => matchesSearch(topic) && matchesProgressFilter(topic))
          .sort(compareTopics)
        const topicCount = mainTopicGroups.reduce((total, group) => total + 1 + group.subTopics.length, 0) + visibleOrphanSubTopics.length

        return {
          course,
          mainTopicGroups,
          orphanSubTopics: visibleOrphanSubTopics,
          topicCount,
        }
      })
      .filter((group) => group.topicCount > 0)
  }, [
    courseById,
    courseId,
    courses,
    onlyWithQuestions,
    preferenceByTopicId,
    preferenceFilter,
    progressByCourseId,
    search,
    topicFilter,
    topicOrderById,
    topicSort,
    topics,
  ])

  function clearTopicFilters() {
    setSearch('')
    setCourseId('')
    setTopicFilter('')
    setTopicSort('curriculum')
    setOnlyWithQuestions(false)
    setPreferenceFilter('')
  }

  function toggleTopicPreference(topicId: string, field: 'isFavorite' | 'isInWeeklyPlan') {
    const current = preferenceByTopicId.get(topicId)
    preferenceMutation.mutate({
      topicId,
      update: { [field]: !(current?.[field] ?? false) },
    })
  }

  function toggleCollapsedId(setter: Dispatch<SetStateAction<Set<string>>>, id: string) {
    setter((current) => {
      const next = new Set(current)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function expandAllTopics() {
    setCollapsedCourseIds(new Set())
    setCollapsedMainTopicIds(new Set())
  }

  function collapseAllTopics() {
    setCollapsedCourseIds(new Set(filteredCourseGroups.map((group) => group.course.id)))
  }

  if (isLoading) {
    return (
      <Stack spacing={2}>
        <Skeleton height={180} variant="rounded" />
        <Skeleton height={80} variant="rounded" />
        <Skeleton height={360} variant="rounded" />
      </Stack>
    )
  }

  if (isError) {
    return (
      <Alert severity="error">
        {error instanceof Error ? error.message : 'Konular yüklenemedi.'}
      </Alert>
    )
  }

  return (
    <Stack spacing={3}>
      <StudentPageHero
        eyebrow="İçerik Keşfi"
        title="Müfredatım"
        description="Erişimin olan dersleri ana konu ve alt konu düzeninde gör, filtrele ve çalışmaya hızlıca geri dön."
        sideContent={
          <Paper sx={{ borderRadius: 3, p: 2.5 }} variant="outlined">
            <Stack spacing={1}>
              <Typography color="text.secondary" sx={{ fontSize: 13, fontWeight: 800 }}>
                TOPLAM KONU
              </Typography>
              <Typography sx={{ fontSize: 42, fontWeight: 900 }}>{topics.length}</Typography>
              <Typography color="text.secondary" variant="body2">
                {courses.length} ders içinde listeleniyor.
              </Typography>
            </Stack>
          </Paper>
        }
      />

      <Paper sx={{ borderRadius: 3, p: 2.5 }} variant="outlined">
        <Stack spacing={2}>
          <Box>
            <Typography sx={{ fontSize: 19, fontWeight: 900 }}>Çalışmaya devam et</Typography>
            <Typography color="text.secondary" variant="body2">
              Son hareketin, öncelikli konun ve yaklaşan tekrarın tek yerde.
            </Typography>
          </Box>

          {isProgressOverviewLoading || isProgressLoading ? (
            <Stack spacing={1}>
              <Skeleton height={92} variant="rounded" />
              <Skeleton height={92} variant="rounded" />
            </Stack>
          ) : (
            <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { lg: 'repeat(3, 1fr)', xs: '1fr' } }}>
              <ContinueStudyCard
                actionLabel={recentActivity ? 'Devam et' : 'Konu seç'}
                color="primary"
                detail={recentActivity
                  ? `${recentActivity.courseName} · ${formatTopicDate(recentActivity.lastStudiedAt)}`
                  : 'Henüz bir çalışma geçmişin bulunmuyor.'}
                icon={<HistoryOutlinedIcon />}
                title={recentActivity?.topicTitle ?? 'İlk konunu çalışmaya başla'}
                to={recentActivity ? `/study/${recentActivity.topicId}` : '/my-topics'}
                eyebrow="SON ÇALIŞILAN"
              />
              <ContinueStudyCard
                actionLabel={recommendedTopic ? 'Şimdi çalış' : 'Konuları incele'}
                color="info"
                detail={recommendedTopic
                  ? `${recommendedTopic.courseName} · ${topicStatusMeta(recommendedTopic.progress.status).label}`
                  : 'Şu anda önerilecek bekleyen bir konu yok.'}
                icon={<AutoAwesomeOutlinedIcon />}
                title={recommendedTopic?.topic.title ?? 'Tüm konular güncel görünüyor'}
                to={recommendedTopic ? `/study/${recommendedTopic.topic.id}` : '/my-topics'}
                eyebrow="SIRADAKİ ÖNERİ"
              />
              <ContinueStudyCard
                actionLabel={upcomingReview ? 'Tekrar et' : 'Listeyi gör'}
                color="warning"
                detail={upcomingReview
                  ? `${upcomingReview.courseName} · ${formatTopicDate(upcomingReview.nextReviewAt)}`
                  : 'Planlanmış yaklaşan tekrar bulunmuyor.'}
                icon={<ReplayOutlinedIcon />}
                title={upcomingReview?.topicTitle ?? 'Tekrar takvimin boş'}
                to={upcomingReview ? `/study/${upcomingReview.topicId}` : '/reviews/today'}
                eyebrow="YAKLAŞAN TEKRAR"
              />
            </Box>
          )}

          {isProgressOverviewError && (
            <Alert severity="warning">
              Son çalışma ve tekrar özeti alınamadı. Konu ilerlemeleri kullanılmaya devam ediyor.
            </Alert>
          )}
        </Stack>
      </Paper>

      {progressErrorCount > 0 && (
        <Alert severity="warning">
          Bazı derslerin ilerleme bilgisi alınamadı. Konular listelenmeye devam ediyor.
        </Alert>
      )}

      <Paper sx={{ borderRadius: 3, p: 2 }} variant="outlined">
        <Stack spacing={1.5}>
          <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography sx={{ fontWeight: 900 }}>Konu filtreleri</Typography>
              <Chip label={`${filteredCourseGroups.reduce((total, group) => total + group.topicCount, 0)} konu gösteriliyor`} size="small" />
              {activeFilterCount > 0 && <Chip color="primary" label={`${activeFilterCount} aktif filtre`} size="small" />}
            </Stack>
            <Button
              disabled={activeFilterCount === 0 && topicSort === 'curriculum'}
              onClick={clearTopicFilters}
              size="small"
              startIcon={<RestartAltOutlinedIcon />}
            >
              Temizle
            </Button>
          </Stack>

          <Box
            sx={{
              '& > *': { minWidth: 0, width: '100%' },
              '& .MuiSelect-select': {
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              },
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: {
                lg: 'minmax(0, 2fr) repeat(3, minmax(0, 1fr))',
                sm: 'repeat(2, minmax(0, 1fr))',
                xs: 'minmax(0, 1fr)',
              },
            }}
          >
            <TextField
              fullWidth
              label="Konu veya ders ara"
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
              fullWidth
              label="Ders"
              onChange={(event) => setCourseId(event.target.value)}
              select
              value={courseId}
            >
              <MenuItem value="">Tüm dersler</MenuItem>
              {courses.map((course) => (
                <MenuItem key={course.id} value={course.id}>
                  {course.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="Çalışma durumu"
              onChange={(event) => setTopicFilter(event.target.value as TopicFilter)}
              select
              value={topicFilter}
            >
              <MenuItem value="">Tüm durumlar</MenuItem>
              <MenuItem value="needs-review">Tekrar gerekenler</MenuItem>
              <MenuItem value="weak">Zayıf konular (%60 altı)</MenuItem>
              <MenuItem value="incomplete">Tamamlanmayanlar</MenuItem>
              <MenuItem value="mastered">Ustalaşılanlar</MenuItem>
            </TextField>
            <TextField
              fullWidth
              label="Sıralama"
              onChange={(event) => setTopicSort(event.target.value as TopicSort)}
              select
              value={topicSort}
            >
              <MenuItem value="curriculum">Müfredat sırası</MenuItem>
              <MenuItem value="priority">Çalışma önceliği</MenuItem>
              <MenuItem value="success-asc">Başarı: düşükten yükseğe</MenuItem>
              <MenuItem value="recent">Son çalışılanlar</MenuItem>
            </TextField>
          </Box>

          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            <Chip
              clickable
              color={preferenceFilter === 'favorite' ? 'warning' : 'default'}
              icon={<StarOutlinedIcon />}
              label={`Favoriler (${favoriteTopicCount})`}
              onClick={() => setPreferenceFilter((current) => current === 'favorite' ? '' : 'favorite')}
              variant={preferenceFilter === 'favorite' ? 'filled' : 'outlined'}
            />
            <Chip
              clickable
              color={preferenceFilter === 'weekly' ? 'primary' : 'default'}
              icon={<PlaylistAddCheckOutlinedIcon />}
              label={`Bu hafta (${weeklyTopicCount})`}
              onClick={() => setPreferenceFilter((current) => current === 'weekly' ? '' : 'weekly')}
              variant={preferenceFilter === 'weekly' ? 'filled' : 'outlined'}
            />
            <Chip
              clickable
              color={onlyWithQuestions ? 'primary' : 'default'}
              label="Yalnızca soru bulunanlar"
              onClick={() => setOnlyWithQuestions((current) => !current)}
              variant={onlyWithQuestions ? 'filled' : 'outlined'}
            />
            <Chip
              clickable
              color={topicFilter === 'needs-review' ? 'warning' : 'default'}
              label="Tekrar gerekenler"
              onClick={() => setTopicFilter((current) => current === 'needs-review' ? '' : 'needs-review')}
              variant={topicFilter === 'needs-review' ? 'filled' : 'outlined'}
            />
            <Chip
              clickable
              color={topicFilter === 'weak' ? 'error' : 'default'}
              label="Zayıf konular"
              onClick={() => setTopicFilter((current) => current === 'weak' ? '' : 'weak')}
              variant={topicFilter === 'weak' ? 'filled' : 'outlined'}
            />
            <Chip
              clickable
              color={topicFilter === 'incomplete' ? 'info' : 'default'}
              label="Tamamlanmayanlar"
              onClick={() => setTopicFilter((current) => current === 'incomplete' ? '' : 'incomplete')}
              variant={topicFilter === 'incomplete' ? 'filled' : 'outlined'}
            />
          </Stack>
          {isTopicPreferencesLoading && (
            <Typography color="text.secondary" variant="caption">
              Favoriler ve çalışma listesi yükleniyor...
            </Typography>
          )}
        </Stack>
        {isProgressLoading && (
          <Box sx={{ mt: 1.5 }}>
            <Typography color="text.secondary" sx={{ mb: 0.75 }} variant="body2">
              Konu ilerlemeleri yükleniyor...
            </Typography>
            <LinearProgress />
          </Box>
        )}
      </Paper>

      {filteredCourseGroups.length === 0 ? (
        <EmptyState title="Konu bulunamadı" description="Arama veya ders filtresini değiştirerek tekrar dene." />
      ) : (
        <Stack spacing={2.5}>
          <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>
            <ToggleButtonGroup
              exclusive
              onChange={(_, nextMode: TopicViewMode | null) => nextMode && setViewMode(nextMode)}
              size="small"
              value={viewMode}
            >
              <ToggleButton value="cards">
                <GridViewOutlinedIcon fontSize="small" sx={{ mr: 0.75 }} />
                Kartlar
              </ToggleButton>
              <ToggleButton value="compact">
                <ViewListOutlinedIcon fontSize="small" sx={{ mr: 0.75 }} />
                Kompakt liste
              </ToggleButton>
            </ToggleButtonGroup>
            <Stack direction="row" spacing={1}>
              <Button onClick={expandAllTopics} size="small" startIcon={<ExpandMoreOutlinedIcon />}>
                Tümünü aç
              </Button>
              <Button onClick={collapseAllTopics} size="small" startIcon={<ExpandLessOutlinedIcon />}>
                Tümünü kapat
              </Button>
            </Stack>
          </Stack>

          {filteredCourseGroups.map((group) => (
            <Stack key={group.course.id} spacing={1.5}>
              <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1} sx={{ alignItems: { sm: 'center', xs: 'flex-start' }, justifyContent: 'space-between' }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', flex: 1, maxWidth: 740, width: '100%' }}>
                  <IconButton
                    aria-label={collapsedCourseIds.has(group.course.id) ? 'Dersi aç' : 'Dersi kapat'}
                    onClick={() => toggleCollapsedId(setCollapsedCourseIds, group.course.id)}
                    size="small"
                    sx={{ mt: -0.25 }}
                  >
                    {collapsedCourseIds.has(group.course.id)
                      ? <ExpandMoreOutlinedIcon />
                      : <ExpandLessOutlinedIcon />}
                  </IconButton>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: 18, fontWeight: 900 }}>{group.course.name}</Typography>
                    <Typography color="text.secondary" variant="body2">
                      {group.mainTopicGroups.length} ana konu · {group.topicCount - group.mainTopicGroups.length} alt konu
                    </Typography>
                  </Box>
                </Stack>
                <Chip label={`${group.topicCount} görünür konu`} size="small" />
              </Stack>

              <CourseProgressSummary
                progress={progressByCourseId.get(group.course.id)}
                visibleTopicCount={group.topicCount}
              />

              <Collapse in={!collapsedCourseIds.has(group.course.id)} timeout="auto" unmountOnExit>
                {viewMode === 'compact' ? (
                  <CompactTopicList
                    courseId={group.course.id}
                    disabled={preferenceMutation.isPending}
                    mainTopicGroups={group.mainTopicGroups}
                    onPreview={setPreviewTopic}
                    onToggleFavorite={(topicId) => toggleTopicPreference(topicId, 'isFavorite')}
                    onToggleWeekly={(topicId) => toggleTopicPreference(topicId, 'isInWeeklyPlan')}
                    orphanSubTopics={group.orphanSubTopics}
                    preferenceByTopicId={preferenceByTopicId}
                    progresses={progressByCourseId.get(group.course.id)?.topics}
                  />
                ) : (
                  <Box
                    sx={{
                      alignItems: 'start',
                      display: 'grid',
                      gap: 2,
                      gridTemplateColumns: { lg: 'repeat(2, minmax(0, 1fr))', xs: '1fr' },
                    }}
                  >
                {group.mainTopicGroups.map(({ mainTopic, subTopics }) => (
                  <Paper
                    key={mainTopic.id}
                    sx={{ alignSelf: 'start', borderRadius: 3, p: 2.5, width: '100%' }}
                    variant="outlined"
                  >
                    <Stack spacing={2}>
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                        <Box
                          sx={{
                            alignItems: 'center',
                            bgcolor: 'rgba(15,118,110,0.08)',
                            borderRadius: 2,
                            color: 'primary.main',
                            display: 'flex',
                            flexShrink: 0,
                            height: 42,
                            justifyContent: 'center',
                            width: 42,
                          }}
                        >
                          <LibraryBooksOutlinedIcon />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 900 }}>{mainTopic.title}</Typography>
                          <Typography color="text.secondary" variant="body2">
                            Ana konu
                          </Typography>
                        </Box>
                        <TopicPreferenceActions
                          disabled={preferenceMutation.isPending}
                          onToggleFavorite={() => toggleTopicPreference(mainTopic.id, 'isFavorite')}
                          onToggleWeekly={() => toggleTopicPreference(mainTopic.id, 'isInWeeklyPlan')}
                          preference={preferenceByTopicId.get(mainTopic.id)}
                        />
                        <IconButton
                          aria-label={collapsedMainTopicIds.has(mainTopic.id) ? 'Ana konu detaylarını aç' : 'Ana konu detaylarını kapat'}
                          onClick={() => toggleCollapsedId(setCollapsedMainTopicIds, mainTopic.id)}
                          size="small"
                        >
                          {collapsedMainTopicIds.has(mainTopic.id)
                            ? <ExpandMoreOutlinedIcon />
                            : <ExpandLessOutlinedIcon />}
                        </IconButton>
                      </Stack>

                      <Collapse in={!collapsedMainTopicIds.has(mainTopic.id)} timeout="auto" unmountOnExit>
                        <Stack spacing={2}>
                          {mainTopic.summary && (
                            <Typography color="text.secondary" sx={{ lineHeight: 1.7 }} variant="body2">
                              {mainTopic.summary.length > 160 ? `${mainTopic.summary.slice(0, 160)}...` : mainTopic.summary}
                            </Typography>
                          )}

                          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                            <Chip label={`${mainTopic.questionCount} soru`} size="small" />
                            <Chip label={`${subTopics.length} alt konu`} size="small" variant="outlined" />
                          </Stack>

                          <TopicProgressSummary
                            courseId={group.course.id}
                            progress={findTopicProgress(progressByCourseId.get(group.course.id)?.topics, mainTopic.id)}
                            topicId={mainTopic.id}
                          />
                          <TopicResourceChips
                            courseId={group.course.id}
                            progress={findTopicProgress(progressByCourseId.get(group.course.id)?.topics, mainTopic.id)}
                            topicId={mainTopic.id}
                          />

                          <Stack direction="row" spacing={1}>
                            <Button
                              onClick={() => setPreviewTopic(mainTopic)}
                              startIcon={<VisibilityOutlinedIcon />}
                              variant="outlined"
                            >
                              Önizle
                            </Button>
                            <Button component={RouterLink} endIcon={<ArrowForwardOutlinedIcon />} to={`/study/${mainTopic.id}`} variant="contained">
                              Ana konuyu çalış
                            </Button>
                            <Button component={RouterLink} to={`/quiz?topicId=${mainTopic.id}`} variant="outlined">
                              Test çöz
                            </Button>
                          </Stack>

                          <Divider />

                          {subTopics.length === 0 ? (
                            <Typography color="text.secondary" variant="body2">
                              Bu ana konuya bağlı alt konu henüz listelenmiyor.
                            </Typography>
                          ) : (
                            <Stack spacing={1}>
                          <Typography color="text.secondary" sx={{ fontSize: 13, fontWeight: 800 }}>
                            Alt Konular
                          </Typography>
                          {subTopics.map((subTopic) => (
                            <Box
                              key={subTopic.id}
                              sx={{
                                bgcolor: 'background.paper',
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 2.5,
                                display: 'grid',
                                gap: 1.5,
                                p: 2,
                              }}
                            >
                              <Stack
                                direction="row"
                                spacing={1.25}
                                sx={{ alignItems: 'flex-start', justifyContent: 'space-between', minWidth: 0 }}
                              >
                              <Box sx={{ minWidth: 0 }}>
                                <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 0.75 }}>
                                  <Typography sx={{ fontWeight: 900, lineHeight: 1.35, width: '100%' }}>{subTopic.title}</Typography>
                                  <TopicStatusChip
                                    progress={findTopicProgress(progressByCourseId.get(group.course.id)?.topics, subTopic.id)}
                                  />
                                  <TopicRiskChip
                                    progress={findTopicProgress(progressByCourseId.get(group.course.id)?.topics, subTopic.id)}
                                  />
                                </Stack>
                                <Typography color="text.secondary" sx={{ mt: 0.75 }} variant="body2">
                                  {topicProgressDetail(
                                    findTopicProgress(progressByCourseId.get(group.course.id)?.topics, subTopic.id),
                                    subTopic.questionCount,
                                  )}
                                </Typography>
                                <TopicResourceChips
                                  compact
                                  courseId={group.course.id}
                                  progress={findTopicProgress(progressByCourseId.get(group.course.id)?.topics, subTopic.id)}
                                  topicId={subTopic.id}
                                />
                              </Box>
                              <TopicPreferenceActions
                                compact
                                disabled={preferenceMutation.isPending}
                                onToggleFavorite={() => toggleTopicPreference(subTopic.id, 'isFavorite')}
                                onToggleWeekly={() => toggleTopicPreference(subTopic.id, 'isInWeeklyPlan')}
                                preference={preferenceByTopicId.get(subTopic.id)}
                              />
                              </Stack>
                              <Box
                                sx={{
                                  borderTop: '1px solid',
                                  borderColor: 'divider',
                                  display: 'grid',
                                  gap: 1,
                                  gridTemplateColumns: {
                                    sm: 'repeat(auto-fit, minmax(112px, 1fr))',
                                    xs: '1fr',
                                  },
                                  pt: 1.5,
                                  width: '100%',
                                  '& .MuiButton-root': {
                                    minHeight: 42,
                                  },
                                }}
                              >
                                <Button component={RouterLink} fullWidth size="small" to={`/study/${subTopic.id}`} variant="contained">
                                  Çalış
                                </Button>
                                <Button
                                  fullWidth
                                  onClick={() => setPreviewTopic(subTopic)}
                                  size="small"
                                  startIcon={<VisibilityOutlinedIcon />}
                                  variant="outlined"
                                >
                                  Önizle
                                </Button>
                                <Button component={RouterLink} fullWidth size="small" to={`/quiz?topicId=${subTopic.id}`} variant="outlined">
                                  Test çöz
                                </Button>
                                {(findTopicProgress(progressByCourseId.get(group.course.id)?.topics, subTopic.id)?.wrongCount ?? 0) > 0 && (
                                  <Button
                                    color="warning"
                                    component={RouterLink}
                                    fullWidth
                                    size="small"
                                    to={wrongAnswersUrl(group.course.id, subTopic.id)}
                                    variant="outlined"
                                  >
                                    Yanlışları çöz
                                  </Button>
                                )}
                              </Box>
                            </Box>
                          ))}
                            </Stack>
                          )}
                        </Stack>
                      </Collapse>
                    </Stack>
                  </Paper>
                ))}

                {group.orphanSubTopics.map((subTopic) => (
                  <Paper
                    key={subTopic.id}
                    sx={{ alignSelf: 'start', borderRadius: 3, p: 2.5, width: '100%' }}
                    variant="outlined"
                  >
                    <Stack spacing={1.5}>
                      <Chip label="Ana konu bağlantısı yok" size="small" sx={{ alignSelf: 'flex-start' }} variant="outlined" />
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography sx={{ fontWeight: 900 }}>{subTopic.title}</Typography>
                        <TopicPreferenceActions
                          disabled={preferenceMutation.isPending}
                          onToggleFavorite={() => toggleTopicPreference(subTopic.id, 'isFavorite')}
                          onToggleWeekly={() => toggleTopicPreference(subTopic.id, 'isInWeeklyPlan')}
                          preference={preferenceByTopicId.get(subTopic.id)}
                        />
                      </Stack>
                      {subTopic.summary && (
                        <Typography color="text.secondary" sx={{ lineHeight: 1.7 }} variant="body2">
                          {subTopic.summary.length > 160 ? `${subTopic.summary.slice(0, 160)}...` : subTopic.summary}
                        </Typography>
                      )}
                      <TopicProgressSummary
                        courseId={group.course.id}
                        progress={findTopicProgress(progressByCourseId.get(group.course.id)?.topics, subTopic.id)}
                        topicId={subTopic.id}
                      />
                      <TopicResourceChips
                        courseId={group.course.id}
                        progress={findTopicProgress(progressByCourseId.get(group.course.id)?.topics, subTopic.id)}
                        topicId={subTopic.id}
                      />
                      <Stack direction="row" spacing={1}>
                        <Button
                          onClick={() => setPreviewTopic(subTopic)}
                          startIcon={<VisibilityOutlinedIcon />}
                          variant="outlined"
                        >
                          Önizle
                        </Button>
                        <Button component={RouterLink} endIcon={<ArrowForwardOutlinedIcon />} to={`/study/${subTopic.id}`} variant="contained">
                          Çalış
                        </Button>
                        <Button component={RouterLink} to={`/quiz?topicId=${subTopic.id}`} variant="outlined">
                          Test çöz
                        </Button>
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
                  </Box>
                )}
              </Collapse>
            </Stack>
          ))}
        </Stack>
      )}

      <TopicPreviewDialog
        courseName={previewTopic ? courseById.get(previewTopic.courseId)?.name : undefined}
        onClose={() => setPreviewTopic(null)}
        open={Boolean(previewTopic)}
        topic={previewTopic}
      />
    </Stack>
  )
}

function TopicPreviewDialog({
  courseName,
  onClose,
  open,
  topic,
}: {
  courseName?: string
  onClose: () => void
  open: boolean
  topic: Topic | null
}) {
  const sections = topic
    ? [
      { title: 'Konu özeti', content: topic.summary },
      { title: 'Önemli noktalar', content: topic.importantPoints },
      { title: 'Sık yapılan hatalar', content: topic.commonMistakes },
      { title: 'Formüller', content: topic.formulas },
      { title: 'Sınav notları', content: topic.examNotes },
      { title: 'Kritik eşikler', content: topic.criticalThresholds },
    ].filter((section): section is { title: string; content: string } => Boolean(section.content?.trim()))
    : []

  return (
    <Dialog
      fullWidth
      maxWidth="md"
      onClose={onClose}
      open={open}
      scroll="paper"
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography color="primary.main" sx={{ fontSize: 12, fontWeight: 900 }}>
          HIZLI KONU ÖNİZLEMESİ
        </Typography>
        <Typography sx={{ fontSize: 22, fontWeight: 900, mt: 0.5 }}>
          {topic?.title ?? 'Konu'}
        </Typography>
        <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', mt: 1, rowGap: 0.75 }}>
          {courseName && <Chip label={courseName} size="small" />}
          <Chip
            label={topic?.type === TopicType.SubTopic ? 'Alt konu' : 'Ana konu'}
            size="small"
            variant="outlined"
          />
          <Chip label={`${topic?.questionCount ?? 0} soru`} size="small" variant="outlined" />
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        {sections.length === 0 ? (
          <Alert severity="info">
            Bu konu için henüz özet, formül veya sınav notu içeriği eklenmemiş.
          </Alert>
        ) : (
          <Stack spacing={2}>
            {sections.map((section) => (
              <Paper key={section.title} sx={{ borderRadius: 2.5, p: 2 }} variant="outlined">
                <Typography sx={{ fontWeight: 900, mb: 1 }}>{section.title}</Typography>
                <Typography
                  color="text.secondary"
                  sx={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}
                  variant="body2"
                >
                  {section.content}
                </Typography>
              </Paper>
            ))}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ flexWrap: 'wrap', gap: 1, px: 3, py: 2 }}>
        <Button onClick={onClose}>Kapat</Button>
        {topic && (
          <>
            <Button component={RouterLink} onClick={onClose} to={`/quiz?topicId=${topic.id}`} variant="outlined">
              Test çöz
            </Button>
            <Button
              component={RouterLink}
              endIcon={<ArrowForwardOutlinedIcon />}
              onClick={onClose}
              to={`/study/${topic.id}`}
              variant="contained"
            >
              Konuyu çalış
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}

function CompactTopicList({
  courseId,
  disabled,
  mainTopicGroups,
  onPreview,
  onToggleFavorite,
  onToggleWeekly,
  orphanSubTopics,
  preferenceByTopicId,
  progresses,
}: {
  courseId: string
  disabled: boolean
  mainTopicGroups: MainTopicGroup[]
  onPreview: (topic: Topic) => void
  onToggleFavorite: (topicId: string) => void
  onToggleWeekly: (topicId: string) => void
  orphanSubTopics: Topic[]
  preferenceByTopicId: Map<string, TopicPreference>
  progresses?: CourseTopicProgress[]
}) {
  return (
    <Paper sx={{ borderRadius: 3, overflow: 'hidden' }} variant="outlined">
      <Stack divider={<Divider flexItem />}>
        {mainTopicGroups.flatMap(({ mainTopic, subTopics }) => [
          <CompactTopicRow
            courseId={courseId}
            disabled={disabled}
            key={mainTopic.id}
            onPreview={() => onPreview(mainTopic)}
            onToggleFavorite={() => onToggleFavorite(mainTopic.id)}
            onToggleWeekly={() => onToggleWeekly(mainTopic.id)}
            preference={preferenceByTopicId.get(mainTopic.id)}
            progress={findTopicProgress(progresses, mainTopic.id)}
            topic={mainTopic}
          />,
          ...subTopics.map((subTopic) => (
            <CompactTopicRow
              courseId={courseId}
              disabled={disabled}
              isSubTopic
              key={subTopic.id}
              onPreview={() => onPreview(subTopic)}
              onToggleFavorite={() => onToggleFavorite(subTopic.id)}
              onToggleWeekly={() => onToggleWeekly(subTopic.id)}
              preference={preferenceByTopicId.get(subTopic.id)}
              progress={findTopicProgress(progresses, subTopic.id)}
              topic={subTopic}
            />
          )),
        ])}
        {orphanSubTopics.map((topic) => (
          <CompactTopicRow
            courseId={courseId}
            disabled={disabled}
            isSubTopic
            key={topic.id}
            onPreview={() => onPreview(topic)}
            onToggleFavorite={() => onToggleFavorite(topic.id)}
            onToggleWeekly={() => onToggleWeekly(topic.id)}
            preference={preferenceByTopicId.get(topic.id)}
            progress={findTopicProgress(progresses, topic.id)}
            topic={topic}
          />
        ))}
      </Stack>
    </Paper>
  )
}

function CompactTopicRow({
  courseId,
  disabled,
  isSubTopic = false,
  onToggleFavorite,
  onToggleWeekly,
  onPreview,
  preference,
  progress,
  topic,
}: {
  courseId: string
  disabled: boolean
  isSubTopic?: boolean
  onToggleFavorite: () => void
  onToggleWeekly: () => void
  onPreview: () => void
  preference?: TopicPreference
  progress?: CourseTopicProgress
  topic: Topic
}) {
  const answeredCount = (progress?.correctCount ?? 0) + (progress?.wrongCount ?? 0)

  return (
    <Box
      sx={{
        alignItems: { lg: 'center', xs: 'flex-start' },
        bgcolor: isSubTopic ? 'action.hover' : 'background.paper',
        display: 'grid',
        gap: 1.25,
        gridTemplateColumns: { lg: 'minmax(260px, 1.5fr) minmax(190px, 1fr) auto auto', xs: '1fr' },
        px: 2,
        py: 1.5,
      }}
    >
      <Box sx={{ minWidth: 0, pl: isSubTopic ? { sm: 4, xs: 1.5 } : 0 }}>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography sx={{ fontWeight: isSubTopic ? 800 : 900 }}>{topic.title}</Typography>
          <Chip label={isSubTopic ? 'Alt konu' : 'Ana konu'} size="small" variant="outlined" />
        </Stack>
        <Typography color="text.secondary" variant="caption">
          {topic.questionCount} soru
          {answeredCount > 0 ? ` · ${answeredCount} cevap · %${Math.round(progress?.successRate ?? 0)} başarı` : ''}
        </Typography>
      </Box>

      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 0.75 }}>
        <TopicStatusChip progress={progress} />
        <TopicRiskChip progress={progress} />
        {(progress?.studyNoteCount ?? 0) > 0 && <Chip label={`${progress?.studyNoteCount} not`} size="small" />}
        {(progress?.sourceDocumentCount ?? 0) > 0 && <Chip label={`${progress?.sourceDocumentCount} PDF`} size="small" />}
        {(progress?.wrongAnswerQueueCount ?? 0) > 0 && (
          <Chip color="warning" label={`${progress?.wrongAnswerQueueCount} yanlış`} size="small" />
        )}
      </Stack>

      <TopicPreferenceActions
        compact
        disabled={disabled}
        onToggleFavorite={onToggleFavorite}
        onToggleWeekly={onToggleWeekly}
        preference={preference}
      />

      <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap' }}>
        <Button onClick={onPreview} size="small" startIcon={<VisibilityOutlinedIcon />}>
          Önizle
        </Button>
        <Button component={RouterLink} size="small" to={`/study/${topic.id}`} variant="outlined">
          Çalış
        </Button>
        <Button component={RouterLink} size="small" to={`/quiz?topicId=${topic.id}`}>
          Test
        </Button>
        {(progress?.wrongAnswerQueueCount ?? 0) > 0 && (
          <Button
            color="warning"
            component={RouterLink}
            size="small"
            to={wrongAnswersUrl(courseId, topic.id)}
          >
            Yanlışlar
          </Button>
        )}
      </Stack>
    </Box>
  )
}

function TopicPreferenceActions({
  compact = false,
  disabled,
  onToggleFavorite,
  onToggleWeekly,
  preference,
}: {
  compact?: boolean
  disabled: boolean
  onToggleFavorite: () => void
  onToggleWeekly: () => void
  preference?: TopicPreference
}) {
  return (
    <Stack direction="row" spacing={0.25} sx={{ alignItems: 'center', flexShrink: 0 }}>
      <IconButton
        aria-label={preference?.isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
        color={preference?.isFavorite ? 'warning' : 'default'}
        disabled={disabled}
        onClick={onToggleFavorite}
        size="small"
      >
        {preference?.isFavorite ? <StarOutlinedIcon /> : <StarBorderOutlinedIcon />}
      </IconButton>
      {compact ? (
        <IconButton
          aria-label={preference?.isInWeeklyPlan ? 'Haftalık listeden çıkar' : 'Bu hafta çalışacağım listesine ekle'}
          color={preference?.isInWeeklyPlan ? 'primary' : 'default'}
          disabled={disabled}
          onClick={onToggleWeekly}
          size="small"
        >
          <PlaylistAddCheckOutlinedIcon />
        </IconButton>
      ) : (
        <Button
          color={preference?.isInWeeklyPlan ? 'primary' : 'inherit'}
          disabled={disabled}
          onClick={onToggleWeekly}
          size="small"
          startIcon={<PlaylistAddCheckOutlinedIcon />}
          variant={preference?.isInWeeklyPlan ? 'contained' : 'text'}
        >
          {preference?.isInWeeklyPlan ? 'Bu hafta' : 'Listeye ekle'}
        </Button>
      )}
    </Stack>
  )
}

function CourseProgressSummary({
  progress,
  visibleTopicCount,
}: {
  progress?: CourseProgress
  visibleTopicCount: number
}) {
  if (!progress) {
    return (
      <Paper sx={{ borderRadius: 2.5, p: 2 }} variant="outlined">
        <Typography color="text.secondary" variant="body2">
          Bu dersin ilerleme özeti henüz yüklenemedi. {visibleTopicCount} konu listeleniyor.
        </Typography>
      </Paper>
    )
  }

  const answeredCount = progress.correctCount + progress.wrongCount
  const progressPercentage = Math.min(100, Math.max(0, Number(progress.progressPercentage)))
  const successRate = Math.min(100, Math.max(0, Number(progress.successRate)))

  return (
    <Paper
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 2.5,
        p: 2,
      }}
      variant="outlined"
    >
      <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { lg: '1.4fr repeat(4, minmax(120px, 1fr))', sm: 'repeat(2, 1fr)', xs: '1fr' } }}>
        <Box>
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between' }}>
            <Typography sx={{ fontWeight: 900 }} variant="body2">Ders ilerlemesi</Typography>
            <Typography color="primary.main" sx={{ fontWeight: 900 }} variant="body2">
              %{Math.round(progressPercentage)}
            </Typography>
          </Stack>
          <LinearProgress
            sx={{ borderRadius: 999, height: 9, mt: 1 }}
            value={progressPercentage}
            variant="determinate"
          />
          <Typography color="text.secondary" sx={{ mt: 0.75 }} variant="caption">
            {progress.studiedTopicCount} / {progress.totalTopicCount} konu çalışıldı
          </Typography>
        </Box>

        <CourseMetric
          label="Tamamlanan"
          tone="success.main"
          value={`${progress.completedTopicCount} konu`}
        />
        <CourseMetric
          label="Genel başarı"
          tone={successRate < 60 ? 'warning.main' : 'primary.main'}
          value={answeredCount > 0 ? `%${Math.round(successRate)}` : 'Henüz yok'}
        />
        <CourseMetric
          label="Çözülen soru"
          value={String(answeredCount)}
          detail={answeredCount > 0 ? `${progress.correctCount} doğru · ${progress.wrongCount} yanlış` : 'Test sonucu yok'}
        />
        <CourseMetric
          label="Son çalışma"
          value={progress.lastActivityAt ? formatTopicDate(progress.lastActivityAt) : 'Başlanmadı'}
          detail={`${progress.needsReviewTopicCount} tekrar · ${progress.masteredTopicCount} ustalaşılan`}
        />
      </Box>
    </Paper>
  )
}

function CourseMetric({
  detail,
  label,
  tone = 'text.primary',
  value,
}: {
  detail?: string
  label: string
  tone?: string
  value: string
}) {
  return (
    <Box sx={{ borderLeft: { lg: '1px solid', xs: 0 }, borderColor: 'divider', pl: { lg: 1.5, xs: 0 } }}>
      <Typography color="text.secondary" sx={{ fontSize: 11, fontWeight: 800 }}>
        {label.toLocaleUpperCase('tr-TR')}
      </Typography>
      <Typography color={tone} sx={{ fontSize: 17, fontWeight: 900, mt: 0.5 }}>{value}</Typography>
      {detail && <Typography color="text.secondary" variant="caption">{detail}</Typography>}
    </Box>
  )
}

function TopicResourceChips({
  compact = false,
  courseId,
  progress,
  topicId,
}: {
  compact?: boolean
  courseId: string
  progress?: CourseTopicProgress
  topicId: string
}) {
  if (!progress) return null

  const showStudyNotes = !compact || progress.studyNoteCount > 0
  const showSourceDocuments = !compact || progress.sourceDocumentCount > 0

  if (
    !showStudyNotes &&
    !showSourceDocuments &&
    progress.wrongAnswerQueueCount === 0 &&
    progress.dueReviewCount === 0
  ) {
    return null
  }

  return (
    <Stack
      direction="row"
      spacing={0.75}
      sx={{ flexWrap: 'wrap', mt: compact ? 0.75 : 0, rowGap: 0.75 }}
    >
      {showStudyNotes && (
        <Chip
          clickable
          component={RouterLink}
          icon={<NoteAltOutlinedIcon />}
          label={`${progress.studyNoteCount} ders notu`}
          size="small"
          to={`/study/${topicId}`}
          variant="outlined"
        />
      )}
      {showSourceDocuments && (
        <Chip
          clickable
          component={RouterLink}
          icon={<PictureAsPdfOutlinedIcon />}
          label={`${progress.sourceDocumentCount} PDF kaynak`}
          size="small"
          to={`/my-materials?courseId=${courseId}`}
          variant="outlined"
        />
      )}
      {progress.wrongAnswerQueueCount > 0 && (
        <Chip
          clickable
          color="warning"
          component={RouterLink}
          icon={<TrendingDownOutlinedIcon />}
          label={`${progress.wrongAnswerQueueCount} yanlış`}
          size="small"
          to={wrongAnswersUrl(courseId, topicId)}
          variant="outlined"
        />
      )}
      {progress.dueReviewCount > 0 && (
        <Chip
          clickable
          color="info"
          component={RouterLink}
          icon={<ReplayOutlinedIcon />}
          label={`${progress.dueReviewCount} tekrar hazır`}
          size="small"
          to="/reviews/today"
          variant="outlined"
        />
      )}
    </Stack>
  )
}

function compareTopicsByMode(
  left: Topic,
  right: Topic,
  mode: TopicSort,
  courseProgress: CourseProgress | undefined,
  fallbackOrder: Map<string, number>,
) {
  const leftProgress = findTopicProgress(courseProgress?.topics, left.id)
  const rightProgress = findTopicProgress(courseProgress?.topics, right.id)
  const curriculumOrder = () =>
    (left.order - right.order) ||
    (fallbackOrder.get(left.id) ?? 0) - (fallbackOrder.get(right.id) ?? 0)

  switch (mode) {
    case 'priority': {
      const priorityDifference = topicPriority(leftProgress) - topicPriority(rightProgress)
      if (priorityDifference !== 0) return priorityDifference

      const successDifference = measuredSuccess(leftProgress) - measuredSuccess(rightProgress)
      return successDifference || curriculumOrder()
    }
    case 'success-asc': {
      const leftMeasured = hasMeasuredResult(leftProgress)
      const rightMeasured = hasMeasuredResult(rightProgress)
      if (leftMeasured !== rightMeasured) return leftMeasured ? -1 : 1

      return measuredSuccess(leftProgress) - measuredSuccess(rightProgress) || curriculumOrder()
    }
    case 'recent': {
      const leftTime = leftProgress?.lastStudiedAt ? new Date(leftProgress.lastStudiedAt).getTime() : 0
      const rightTime = rightProgress?.lastStudiedAt ? new Date(rightProgress.lastStudiedAt).getTime() : 0
      return rightTime - leftTime || curriculumOrder()
    }
    default:
      return curriculumOrder()
  }
}

function topicPriority(progress?: CourseTopicProgress) {
  switch (progress?.status ?? StudyStatus.NotStarted) {
    case StudyStatus.NeedsReview:
      return 0
    case StudyStatus.InProgress:
      return 1
    case StudyStatus.NotStarted:
      return 2
    case StudyStatus.Studied:
      return 3
    case StudyStatus.Mastered:
      return 4
  }
}

function hasMeasuredResult(progress?: CourseTopicProgress) {
  return (progress?.correctCount ?? 0) + (progress?.wrongCount ?? 0) > 0
}

function measuredSuccess(progress?: CourseTopicProgress) {
  return hasMeasuredResult(progress) ? Number(progress?.successRate ?? 0) : 101
}

function ContinueStudyCard({
  actionLabel,
  color,
  detail,
  eyebrow,
  icon,
  title,
  to,
}: {
  actionLabel: string
  color: 'primary' | 'info' | 'warning'
  detail: string
  eyebrow: string
  icon: ReactNode
  title: string
  to: string
}) {
  return (
    <Box
      sx={{
        bgcolor: `${color}.50`,
        border: '1px solid',
        borderColor: `${color}.main`,
        borderRadius: 2.5,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 190,
        p: 2,
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', color: `${color}.main` }}>
        {icon}
        <Typography sx={{ fontSize: 12, fontWeight: 900 }}>{eyebrow}</Typography>
      </Stack>
      <Typography sx={{ fontSize: 17, fontWeight: 900, mt: 1.5 }}>{title}</Typography>
      <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">{detail}</Typography>
      <Button
        color={color}
        component={RouterLink}
        endIcon={<ArrowForwardOutlinedIcon />}
        size="small"
        sx={{ alignSelf: 'flex-start', mt: 'auto', pt: 1.5 }}
        to={to}
      >
        {actionLabel}
      </Button>
    </Box>
  )
}

interface RecommendedTopic {
  courseName: string
  topic: Topic
  progress: CourseTopicProgress
}

function findRecommendedTopic(
  courses: Course[],
  topics: Topic[],
  progressByCourseId: Map<string, CourseProgress>,
): RecommendedTopic | undefined {
  const statusPriority = new Map<StudyStatus, number>([
    [StudyStatus.NeedsReview, 0],
    [StudyStatus.InProgress, 1],
    [StudyStatus.NotStarted, 2],
    [StudyStatus.Studied, 3],
  ])
  const courseOrder = new Map(courses.map((course) => [course.id, course.order]))
  const courseName = new Map(courses.map((course) => [course.id, course.name]))
  const topicById = new Map(topics.map((topic) => [topic.id, topic]))

  const candidates = Array.from(progressByCourseId.values())
    .flatMap((courseProgress) =>
      courseProgress.topics
        .filter((progress) => progress.status !== StudyStatus.Mastered)
        .map((progress) => ({
          courseName: courseName.get(courseProgress.courseId) ?? courseProgress.courseName,
          topic: topicById.get(progress.topicId),
          progress,
          courseOrder: courseOrder.get(courseProgress.courseId) ?? Number.MAX_SAFE_INTEGER,
        })),
    )
    .filter((item): item is RecommendedTopic & { courseOrder: number } => Boolean(item.topic))
    .sort((left, right) =>
      (statusPriority.get(left.progress.status) ?? 99) - (statusPriority.get(right.progress.status) ?? 99) ||
      left.courseOrder - right.courseOrder ||
      left.topic.order - right.topic.order)

  return candidates[0]
}

function TopicProgressSummary({
  courseId,
  progress,
  topicId,
}: {
  courseId: string
  progress?: CourseTopicProgress
  topicId: string
}) {
  const answeredCount = (progress?.correctCount ?? 0) + (progress?.wrongCount ?? 0)

  return (
    <Box
      sx={{
        bgcolor: 'action.hover',
        borderRadius: 2,
        p: 1.5,
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <TopicStatusChip progress={progress} />
          <TopicRiskChip progress={progress} />
        </Stack>
        {answeredCount > 0 && (
          <Typography sx={{ fontWeight: 900 }} variant="body2">
            %{Math.round(progress?.successRate ?? 0)} başarı
          </Typography>
        )}
      </Stack>

      {answeredCount > 0 ? (
        <>
          <LinearProgress
            color={progress && progress.successRate < 60 ? 'warning' : 'primary'}
            sx={{ borderRadius: 999, height: 7, mt: 1 }}
            value={Math.min(100, Math.max(0, Number(progress?.successRate ?? 0)))}
            variant="determinate"
          />
          <Typography color="text.secondary" sx={{ mt: 0.75 }} variant="body2">
            {progress?.correctCount} doğru · {progress?.wrongCount} yanlış
          </Typography>
        </>
      ) : (
        <Typography color="text.secondary" sx={{ mt: 0.75 }} variant="body2">
          {progress?.lastStudiedAt
            ? `Son çalışma: ${formatTopicDate(progress.lastStudiedAt)}`
            : 'Bu konuda henüz ölçülmüş bir test sonucu yok.'}
        </Typography>
      )}

      {progress?.nextReviewAt && (
        <Typography color="warning.main" sx={{ fontWeight: 700, mt: 0.5 }} variant="body2">
          Tekrar tarihi: {formatTopicDate(progress.nextReviewAt)}
        </Typography>
      )}

      {(progress?.wrongCount ?? 0) > 0 && (
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Button
            color="warning"
            component={RouterLink}
            size="small"
            startIcon={<TrendingDownOutlinedIcon />}
            to={wrongAnswersUrl(courseId, topicId)}
            variant="outlined"
          >
            Yanlışları çöz
          </Button>
          <Button component={RouterLink} size="small" to={`/study/${topicId}`}>
            Konuyu güçlendir
          </Button>
        </Stack>
      )}
    </Box>
  )
}

function TopicStatusChip({ progress }: { progress?: CourseTopicProgress }) {
  const status = progress?.status ?? StudyStatus.NotStarted
  const meta = topicStatusMeta(status)

  return <Chip color={meta.color} label={meta.label} size="small" variant={status === StudyStatus.NotStarted ? 'outlined' : 'filled'} />
}

function TopicRiskChip({ progress }: { progress?: CourseTopicProgress }) {
  const risk = topicRisk(progress)
  if (!risk) return null

  return (
    <Chip
      color={risk.color}
      icon={<TrendingDownOutlinedIcon />}
      label={risk.label}
      size="small"
      variant="outlined"
    />
  )
}

function topicRisk(progress?: CourseTopicProgress) {
  if (!hasMeasuredResult(progress)) return null

  const successRate = Number(progress?.successRate ?? 0)
  const wrongCount = progress?.wrongCount ?? 0

  if (successRate < 40 || wrongCount >= 10) {
    return { color: 'error' as const, label: 'Kritik zayıf' }
  }
  if (successRate < 60 || wrongCount >= 5) {
    return { color: 'warning' as const, label: 'Zayıf konu' }
  }
  if (successRate < 75 || progress?.status === StudyStatus.NeedsReview) {
    return { color: 'info' as const, label: 'Geliştirilmeli' }
  }

  return null
}

function wrongAnswersUrl(courseId: string, topicId: string) {
  const params = new URLSearchParams({ courseId, topicId })
  return `/quiz/wrong-answers?${params.toString()}`
}

function readTopicViewMode(): TopicViewMode {
  try {
    return window.localStorage.getItem(topicViewModeStorageKey) === 'compact' ? 'compact' : 'cards'
  } catch {
    return 'cards'
  }
}

function topicStatusMeta(status: StudyStatus) {
  switch (status) {
    case StudyStatus.InProgress:
      return { color: 'info' as const, label: 'Devam ediyor' }
    case StudyStatus.Studied:
      return { color: 'primary' as const, label: 'Çalışıldı' }
    case StudyStatus.NeedsReview:
      return { color: 'warning' as const, label: 'Tekrar gerekli' }
    case StudyStatus.Mastered:
      return { color: 'success' as const, label: 'Ustalaşıldı' }
    default:
      return { color: 'default' as const, label: 'Başlanmadı' }
  }
}

function findTopicProgress(progresses: CourseTopicProgress[] | undefined, topicId: string) {
  return progresses?.find((progress) => progress.topicId === topicId)
}

function topicProgressDetail(progress: CourseTopicProgress | undefined, questionCount: number) {
  const answeredCount = (progress?.correctCount ?? 0) + (progress?.wrongCount ?? 0)
  if (answeredCount === 0) return `${questionCount} soru`

  return `${questionCount} soru · ${answeredCount} cevap · %${Math.round(progress?.successRate ?? 0)} başarı`
}

function formatTopicDate(value?: string | null) {
  if (!value) return 'Tarih belirtilmedi'

  return new Date(value).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
