import { create } from 'zustand'

interface QuizResultStore {
  expandedQuestionIds: Record<string, boolean>
  setExpanded: (questionId: string, expanded: boolean) => void
  initExpandedFromAnswers: (items: { questionId: string; defaultExpanded: boolean }[]) => void
  reset: () => void
}

export const useQuizResultStore = create<QuizResultStore>((set) => ({
  expandedQuestionIds: {},
  setExpanded: (questionId, expanded) =>
    set((state) => ({
      expandedQuestionIds: { ...state.expandedQuestionIds, [questionId]: expanded },
    })),
  initExpandedFromAnswers: (items) =>
    set({
      expandedQuestionIds: Object.fromEntries(
        items.map((item) => [item.questionId, item.defaultExpanded]),
      ),
    }),
  reset: () => set({ expandedQuestionIds: {} }),
}))
