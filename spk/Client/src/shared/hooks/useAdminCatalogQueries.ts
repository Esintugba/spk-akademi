import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  coursesApi,
  licensesApi,
  questionsApi,
  sourceDocumentsApi,
  studyNotesApi,
  topicsApi,
  trialExamsApi,
} from '../api'

export const adminCatalogQueryKeys = {
  licenses: ['app-data', 'licenses'] as const,
  courses: ['app-data', 'courses'] as const,
  topics: ['app-data', 'topics'] as const,
  studyNotes: ['app-data', 'study-notes'] as const,
  questions: ['app-data', 'questions'] as const,
  sourceDocuments: ['app-data', 'source-documents'] as const,
  trialExams: ['app-data', 'trial-exams'] as const,
}

export function useLicenses() {
  return useQuery({ queryFn: licensesApi.getAll, queryKey: adminCatalogQueryKeys.licenses })
}

export function useCourses() {
  return useQuery({ queryFn: () => coursesApi.getAll(), queryKey: adminCatalogQueryKeys.courses })
}

export function useTopics() {
  return useQuery({ queryFn: () => topicsApi.getAll(), queryKey: adminCatalogQueryKeys.topics })
}

export function useStudyNotes() {
  return useQuery({ queryFn: () => studyNotesApi.getAll(), queryKey: adminCatalogQueryKeys.studyNotes })
}

export function useQuestions() {
  return useQuery({ queryFn: () => questionsApi.getAll(), queryKey: adminCatalogQueryKeys.questions })
}

export function useSourceDocuments() {
  return useQuery({ queryFn: () => sourceDocumentsApi.getAll(), queryKey: adminCatalogQueryKeys.sourceDocuments })
}

export function useTrialExams() {
  return useQuery({ queryFn: trialExamsApi.getAll, queryKey: adminCatalogQueryKeys.trialExams })
}

export function useAdminCatalogInvalidation() {
  const queryClient = useQueryClient()

  return {
    reloadLicenses: () => queryClient.invalidateQueries({ queryKey: adminCatalogQueryKeys.licenses }),
    reloadCourses: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminCatalogQueryKeys.courses }),
        queryClient.invalidateQueries({ queryKey: adminCatalogQueryKeys.licenses }),
      ])
    },
    reloadTopics: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminCatalogQueryKeys.courses }),
        queryClient.invalidateQueries({ queryKey: adminCatalogQueryKeys.topics }),
      ])
    },
    reloadStudyNotes: () => queryClient.invalidateQueries({ queryKey: adminCatalogQueryKeys.studyNotes }),
    reloadQuestions: () => queryClient.invalidateQueries({ queryKey: adminCatalogQueryKeys.questions }),
    reloadSourceDocuments: () => queryClient.invalidateQueries({ queryKey: adminCatalogQueryKeys.sourceDocuments }),
    reloadTrialExams: () => queryClient.invalidateQueries({ queryKey: adminCatalogQueryKeys.trialExams }),
  }
}
