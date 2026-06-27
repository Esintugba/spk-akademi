import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TrialSessionState {
  attemptId: string | null
  quizId: string | null
  answers: Record<string, string>
  setSession: (attemptId: string, quizId: string) => void
  setAnswer: (questionId: string, optionId: string) => void
  clearSession: () => void
}

export const useQuizTrialStore = create<TrialSessionState>()(
  persist(
    (set) => ({
      attemptId: null,
      quizId: null,
      answers: {},
      setSession: (attemptId, quizId) => set({ attemptId, quizId, answers: {} }),
      setAnswer: (questionId, optionId) =>
        set((state) => ({
          answers: { ...state.answers, [questionId]: optionId },
        })),
      clearSession: () => set({ attemptId: null, quizId: null, answers: {} }),
    }),
    { name: 'spk-my-trial-session' },
  ),
)
