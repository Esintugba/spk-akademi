import { create } from 'zustand'
import type { QuizCatalogFilters } from '../models/quizCatalog'

interface QuizCatalogState {
  filters: QuizCatalogFilters
  setFilter: <K extends keyof QuizCatalogFilters>(key: K, value: QuizCatalogFilters[K]) => void
  resetFilters: () => void
}

const defaultFilters: QuizCatalogFilters = {
  difficulty: '',
  sortBy: 'newest',
  status: '',
}

export const useQuizCatalogStore = create<QuizCatalogState>((set) => ({
  filters: defaultFilters,
  setFilter: (key, value) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value,
      },
    })),
  resetFilters: () => set({ filters: defaultFilters }),
}))
