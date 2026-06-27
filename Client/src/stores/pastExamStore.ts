import { create } from 'zustand'
import type { PastExamsFormValues } from '../features/past-exams/pastExamsSchema'

interface PastExamStore {
  lastFilters: Partial<PastExamsFormValues> | null
  setLastFilters: (filters: Partial<PastExamsFormValues>) => void
}

export const usePastExamStore = create<PastExamStore>((set) => ({
  lastFilters: null,
  setLastFilters: (filters) => set({ lastFilters: filters }),
}))

