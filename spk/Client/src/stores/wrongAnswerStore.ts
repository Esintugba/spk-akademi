import { create } from 'zustand'
import type { StartWrongAnswersQuizRequest } from '../models/wrongAnswer'

interface WrongAnswerFilters extends StartWrongAnswersQuizRequest {
  dueOnly: boolean
}

interface WrongAnswerStore {
  filters: WrongAnswerFilters
  sessionAttemptId: string | null
  answers: Record<string, string>
  setFilters: (partial: Partial<WrongAnswerFilters>) => void
  setSession: (attemptId: string) => void
  setAnswer: (questionId: string, optionId: string) => void
  clearSession: () => void
}

const defaultFilters: WrongAnswerFilters = {
  questionCount: 25,
  courseId: null,
  topicId: null,
  difficulty: null,
  dueOnly: false,
}

export const useWrongAnswerStore = create<WrongAnswerStore>((set) => ({
  filters: defaultFilters,
  sessionAttemptId: null,
  answers: {},
  setFilters: (partial) =>
    set((state) => ({
      filters: { ...state.filters, ...partial },
    })),
  setSession: (attemptId) => set({ sessionAttemptId: attemptId, answers: {} }),
  setAnswer: (questionId, optionId) =>
    set((state) => ({
      answers: { ...state.answers, [questionId]: optionId },
    })),
  clearSession: () => set({ sessionAttemptId: null, answers: {} }),
}))
