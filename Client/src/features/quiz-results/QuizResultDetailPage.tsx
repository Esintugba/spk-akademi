import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useVirtualizer } from '@tanstack/react-virtual'
import ReplayOutlinedIcon from '@mui/icons-material/ReplayOutlined'
import { Alert, Box, Button, Skeleton, Stack, Typography } from '@mui/material'
import { useEffect, useMemo, useRef } from 'react'
import { Link as RouterLink, useParams } from 'react-router'
import { QuizMode } from '../../models/enums'
import { quizResultApi, settingsApi } from '../../shared/api'
import { useQuizResultStore } from '../../stores/quizResultStore'
import { StudentPageHero } from '../../components/common/StudentPageHero'
import { QuestionSolutionCard } from './components/QuestionSolutionCard'
import { ResultSummaryCards } from './components/ResultSummaryCards'
import { TopicAnalyticsBadges } from './components/TopicAnalyticsBadges'
import { QuizResultErrorBoundary } from './QuizResultErrorBoundary'

const PAGE_SIZE = 15

export function QuizResultDetailPage() {
  const { attemptId = '' } = useParams()
  const parentRef = useRef<HTMLDivElement>(null)
  const initExpanded = useQuizResultStore((s) => s.initExpandedFromAnswers)
  const resetStore = useQuizResultStore((s) => s.reset)
  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.get,
    staleTime: 300_000,
  })

  const query = useInfiniteQuery({
    queryKey: ['quiz-result', attemptId],
    enabled: Boolean(attemptId),
    queryFn: ({ pageParam }) =>
      quizResultApi.getResultDetail(attemptId, {
        page: pageParam,
        pageSize: PAGE_SIZE,
        includeExplanations: true,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.page + 1 : undefined),
    retry: 2,
  })

  const summary = query.data?.pages[0]
  const allAnswers = useMemo(
    () => query.data?.pages.flatMap((page) => page.answers) ?? [],
    [query.data],
  )

  useEffect(() => {
    resetStore()
    return () => resetStore()
  }, [attemptId, resetStore])

  useEffect(() => {
    if (allAnswers.length > 0) {
      const shouldAutoOpenExplanations = settingsQuery.data?.autoOpenExplanations !== false
      initExpanded(
        allAnswers.map((a) => ({
          questionId: a.questionId,
          defaultExpanded: Boolean(a.explanation) && shouldAutoOpenExplanations,
        })),
      )
    }
  }, [allAnswers, initExpanded, settingsQuery.data?.autoOpenExplanations])

  const virtualizer = useVirtualizer({
    count: allAnswers.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 320,
    overscan: 4,
  })

  useEffect(() => {
    const items = virtualizer.getVirtualItems()
    const last = items[items.length - 1]
    if (!last || !query.hasNextPage || query.isFetchingNextPage) {
      return
    }

    if (last.index >= allAnswers.length - 3) {
      void query.fetchNextPage()
    }
  }, [allAnswers.length, query, virtualizer])

  if (query.isLoading) {
    return (
      <Stack spacing={2}>
        <Skeleton height={180} variant="rounded" />
        <Skeleton height={120} variant="rounded" />
        <Skeleton height={400} variant="rounded" />
      </Stack>
    )
  }

  if (query.isError || !summary) {
    return (
      <Stack spacing={2}>
        <Alert severity="error">
          {query.error instanceof Error ? query.error.message : 'Sonuç detayı yüklenemedi.'}
        </Alert>
        <Button onClick={() => void query.refetch()} startIcon={<ReplayOutlinedIcon />} variant="outlined">
          Tekrar dene
        </Button>
      </Stack>
    )
  }

  return (
    <QuizResultErrorBoundary>
      <Stack spacing={3}>
        <StudentPageHero
          eyebrow="Açıklamalı Sonuç"
          title={summary.quizTitle}
          description={
            summary.quizMode === QuizMode.CoursePractice && summary.courseName
              ? `${summary.courseName} dersi için konu bazlı performans, süre analizi ve zayıf konular aşağıda.`
              : 'Her sorunun doğru cevabını, verdiğin cevabı ve detaylı açıklamayı incele. Yanlış sorularda açıklamalar otomatik açılır.'
          }
          actions={
            <Stack direction="row" spacing={1}>
              {summary.quizMode === QuizMode.CoursePractice && (
                <Button component={RouterLink} to="/quiz/course-practice" variant="outlined">
                  Yeni ders testi
                </Button>
              )}
              <Button component={RouterLink} to="/quiz/wrong-answers" variant="outlined">
                Yanlışlarım
              </Button>
              <Button component={RouterLink} to="/quiz" variant="contained">
                Soru bankası
              </Button>
            </Stack>
          }
        />

        <ResultSummaryCards result={summary} />
        <TopicAnalyticsBadges analytics={summary.analytics} />

        <Typography sx={{ fontWeight: 800 }} variant="h6">
          Soru bazlı çözümler ({summary.totalAnswerCount})
        </Typography>

        <Box
          ref={parentRef}
          sx={{
            height: { md: '70vh', xs: '65vh' },
            overflow: 'auto',
            pr: 0.5,
          }}
        >
          <Box sx={{ height: virtualizer.getTotalSize(), position: 'relative', width: '100%' }}>
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const answer = allAnswers[virtualRow.index]
              if (!answer) {
                return null
              }

              return (
                <Box
                  data-index={virtualRow.index}
                  key={answer.questionId}
                  ref={virtualizer.measureElement}
                  sx={{
                    left: 0,
                    position: 'absolute',
                    top: 0,
                    transform: `translateY(${virtualRow.start}px)`,
                    width: '100%',
                    pb: 2,
                  }}
                >
                  <QuestionSolutionCard answer={answer} index={answer.order - 1} />
                </Box>
              )
            })}
          </Box>
        </Box>

        {query.isFetchingNextPage && <Skeleton height={120} variant="rounded" />}
      </Stack>
    </QuizResultErrorBoundary>
  )
}
