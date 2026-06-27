import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { materialsApi, progressApi, topicPreferencesApi } from '../../../shared/api'
import { useCourses, useTopics } from '../../../shared/hooks'

export const studentContentQueryKeys = {
  materials: ['student-content', 'materials'] as const,
  notes: ['student-content', 'notes'] as const,
  progressOverview: ['student-content', 'progress-overview'] as const,
  courseProgresses: ['student-content', 'course-progresses'] as const,
  topicPreferences: ['student-content', 'topic-preferences'] as const,
  topicProgress: (courseId: string) => ['student-content', 'topic-progress', courseId] as const,
}

export function useMyTopicsData() {
  const coursesQuery = useCourses()
  const topicsQuery = useTopics()
  const progressOverviewQuery = useQuery({
    queryFn: progressApi.getOverview,
    queryKey: studentContentQueryKeys.progressOverview,
    staleTime: 30_000,
  })
  const courseProgressesQuery = useQuery({
    queryFn: progressApi.getCourseProgresses,
    queryKey: studentContentQueryKeys.courseProgresses,
    staleTime: 30_000,
  })
  const topicPreferencesQuery = useQuery({
    queryFn: topicPreferencesApi.getAll,
    queryKey: studentContentQueryKeys.topicPreferences,
    staleTime: 30_000,
  })
  const progressByCourseId = useMemo(
    () => new Map(
      (courseProgressesQuery.data ?? [])
        .map((progress) => [progress.courseId, progress]),
    ),
    [courseProgressesQuery.data],
  )

  return {
    courses: coursesQuery.data ?? [],
    topics: topicsQuery.data ?? [],
    isLoading: coursesQuery.isLoading || topicsQuery.isLoading,
    isError: coursesQuery.isError || topicsQuery.isError,
    error: coursesQuery.error ?? topicsQuery.error,
    progressByCourseId,
    isProgressLoading: courseProgressesQuery.isLoading,
    progressErrorCount: courseProgressesQuery.isError ? 1 : 0,
    progressOverview: progressOverviewQuery.data,
    isProgressOverviewLoading: progressOverviewQuery.isLoading,
    isProgressOverviewError: progressOverviewQuery.isError,
    topicPreferences: topicPreferencesQuery.data ?? [],
    isTopicPreferencesLoading: topicPreferencesQuery.isLoading,
  }
}

export function useMyMaterials() {
  return useQuery({
    queryKey: studentContentQueryKeys.materials,
    queryFn: () => materialsApi.getLibrary({ take: 200 }),
    staleTime: 60_000,
  })
}

export function useMyNotes() {
  return useQuery({
    queryKey: studentContentQueryKeys.notes,
    queryFn: () => materialsApi.getMyNotes({ take: 200 }),
    staleTime: 30_000,
  })
}
