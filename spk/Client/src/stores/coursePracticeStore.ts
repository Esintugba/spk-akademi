import { create } from 'zustand'
import type { CoursePracticeFormValues } from '../features/course-practice/coursePracticeSchema'

interface CoursePracticeStore {
  lastFilters: Partial<CoursePracticeFormValues> | null
  sessionAttemptId: string | null
  answers: Record<string, string>
  questionStartedAt: Record<string, number>
  setLastFilters: (filters: Partial<CoursePracticeFormValues>) => void
  setSession: (attemptId: string) => void
  setAnswer: (questionId: string, optionId: string) => void
  markQuestionStart: (questionId: string) => void
  clearSession: () => void
}

export const useCoursePracticeStore = create<CoursePracticeStore>((set) => ({
  lastFilters: null,
  sessionAttemptId: null,
  answers: {},
  questionStartedAt: {},
  setLastFilters: (filters) => set({ lastFilters: filters }),
  setSession: (attemptId) =>
    set({ sessionAttemptId: attemptId, answers: {}, questionStartedAt: {} }),
  setAnswer: (questionId, optionId) =>
    set((state) => ({
      answers: { ...state.answers, [questionId]: optionId },
    })),
  markQuestionStart: (questionId) =>
    set((state) => ({
      questionStartedAt: {
        ...state.questionStartedAt,
        [questionId]: state.questionStartedAt[questionId] ?? Date.now(),
      },
    })),
  clearSession: () =>
    set({ sessionAttemptId: null, answers: {}, questionStartedAt: {} }),
}))
