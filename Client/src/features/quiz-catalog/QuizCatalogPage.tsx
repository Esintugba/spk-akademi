import SortOutlinedIcon from '@mui/icons-material/SortOutlined'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Alert, Box, Button, FormControl, InputLabel, MenuItem, Select, Skeleton, Stack } from '@mui/material'
import { useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { EmptyState } from '../../components/common/EmptyState'
import { StudentPageHero } from '../../components/common/StudentPageHero'
import type { Course, License, Topic } from '../../models'
import type { QuizCatalogItem } from '../../models/quizCatalog'
import { useQuizTrialStore } from '../../stores/quizTrialStore'
import { useQuizCatalogStore } from '../../stores/quizCatalogStore'
import { FeaturedQuizCarousel } from './components/FeaturedQuizCarousel'
import { QuizCatalogCard } from './components/QuizCatalogCard'
import { QuizFilterSidebar } from './components/QuizFilterSidebar'
import { useFeaturedQuizzes, useQuizCatalog, useRecommendedQuizzes, useStartLicensedQuiz } from './hooks/useQuizCatalogQueries'

interface QuizCatalogPageProps {
  courses: Course[]
  licenses: License[]
  topics: Topic[]
}

export function QuizCatalogPage({ courses, licenses, topics }: QuizCatalogPageProps) {
  const { licenseId } = useParams()
  const navigate = useNavigate()
  const parentRef = useRef<HTMLDivElement | null>(null)
  const setSession = useQuizTrialStore((state) => state.setSession)
  const filters = useQuizCatalogStore((state) => state.filters)
  const setFilter = useQuizCatalogStore((state) => state.setFilter)
  const resetFilters = useQuizCatalogStore((state) => state.resetFilters)
  const [startingQuizId, setStartingQuizId] = useState<string | null>(null)

  const effectiveFilters = useMemo(
    () => ({
      ...filters,
      licenseId: licenseId ?? filters.licenseId,
    }),
    [filters, licenseId],
  )

  const catalogQuery = useQuizCatalog(effectiveFilters, licenseId)
  const featuredQuery = useFeaturedQuizzes()
  const recommendedQuery = useRecommendedQuizzes()
  const startMutation = useStartLicensedQuiz(() => setStartingQuizId(null))

  const quizzes = catalogQuery.data?.pages.flatMap((page) => page.items) ?? []
  const virtualizer = useVirtualizer({
    count: quizzes.length,
    estimateSize: () => 235,
    getScrollElement: () => parentRef.current,
    overscan: 6,
  })

  function handlePrimaryAction(quiz: QuizCatalogItem) {
    if (quiz.userProgress.completed) {
      navigate(`/quizzes/${quiz.id}`)
      return
    }

    if (quiz.userProgress.inProgress && quiz.userProgress.activeAttemptId) {
      setSession(quiz.userProgress.activeAttemptId, quiz.id)
      navigate(`/quiz/session/${quiz.userProgress.activeAttemptId}`)
      return
    }

    setStartingQuizId(quiz.id)
    startMutation.mutate(quiz.id)
  }

  return (
    <Stack spacing={3}>
      <StudentPageHero
        eyebrow="Deneme Kataloğu"
        title={licenseId ? 'Lisansa Ait Denemeler' : 'Deneme Keşfi'}
        description="Lisansına göre erişebildiğin denemeleri keşfet, filtrele ve son durumunu takip et."
        sideContent={
          <FormControl fullWidth size="small" sx={{ alignSelf: 'center', minWidth: { sm: 220, xs: 0 } }}>
            <InputLabel>Sıralama</InputLabel>
            <Select
              label="Sıralama"
              onChange={(event) => setFilter('sortBy', event.target.value as typeof filters.sortBy)}
              startAdornment={<SortOutlinedIcon sx={{ mr: 1, opacity: 0.55 }} />}
              value={filters.sortBy ?? 'newest'}
            >
              <MenuItem value="newest">Yeni Eklenenler</MenuItem>
              <MenuItem value="popular">Popüler</MenuItem>
              <MenuItem value="highest-rated">En Yüksek Puan</MenuItem>
              <MenuItem value="shortest-duration">En Kısa Süre</MenuItem>
              <MenuItem value="highest-success-rate">En Yüksek Başarı</MenuItem>
            </Select>
          </FormControl>
        }
      />

      <FeaturedQuizCarousel
        onSelect={(quizId) => navigate(`/quizzes/${quizId}`)}
        quizzes={featuredQuery.data ?? []}
        title="Öne Çıkan Denemeler"
      />
      <FeaturedQuizCarousel
        onSelect={(quizId) => navigate(`/quizzes/${quizId}`)}
        quizzes={recommendedQuery.data ?? []}
        title="Senin İçin Önerilenler"
        variant="recommended"
      />

      {catalogQuery.error instanceof Error && <Alert severity="error">{catalogQuery.error.message}</Alert>}
      {startMutation.error instanceof Error && <Alert severity="error">{startMutation.error.message}</Alert>}

      <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { lg: '280px 1fr', xs: '1fr' } }}>
        <QuizFilterSidebar
          courses={courses}
          filters={effectiveFilters}
          licenses={licenses}
          onChange={setFilter}
          onReset={resetFilters}
          topics={topics}
        />

        {catalogQuery.isLoading ? (
          <Stack spacing={2}>
            {[1, 2, 3].map((item) => (
              <Skeleton height={220} key={item} variant="rounded" />
            ))}
          </Stack>
        ) : quizzes.length === 0 ? (
          <EmptyState title="Deneme bulunamadı" description="Seçili filtrelere uygun erişilebilir deneme görünmüyor." />
        ) : (
          <Stack spacing={2}>
            <Box ref={parentRef} sx={{ height: '72vh', overflow: 'auto', pr: 1 }}>
              <Box sx={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
                {virtualizer.getVirtualItems().map((virtualItem) => {
                  const quiz = quizzes[virtualItem.index]
                  return (
                    <Box
                      key={quiz.id}
                      sx={{
                        left: 0,
                        position: 'absolute',
                        top: 0,
                        transform: `translateY(${virtualItem.start}px)`,
                        width: '100%',
                      }}
                    >
                      <QuizCatalogCard
                        isStarting={startingQuizId === quiz.id}
                        onOpen={(item) => navigate(`/quizzes/${item.id}`)}
                        onPrimaryAction={handlePrimaryAction}
                        quiz={quiz}
                      />
                    </Box>
                  )
                })}
              </Box>
            </Box>
            {catalogQuery.hasNextPage && (
              <Button disabled={catalogQuery.isFetchingNextPage} onClick={() => void catalogQuery.fetchNextPage()} variant="outlined">
                Daha Fazla Yükle
              </Button>
            )}
          </Stack>
        )}
      </Box>
    </Stack>
  )
}
