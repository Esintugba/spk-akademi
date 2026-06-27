import { create } from 'zustand'
import type { ActiveQuizSession } from '../models/quizSession'

interface ResumePromptState {
  open: boolean
  existingSession: ActiveQuizSession | null
  onResume?: () => void
  onRestart?: () => void
}

interface QuizSessionStore {
  resumePrompt: ResumePromptState
  openResumePrompt: (payload: Omit<ResumePromptState, 'open'>) => void
  closeResumePrompt: () => void
  reset: () => void
}

const defaultResumePrompt: ResumePromptState = {
  open: false,
  existingSession: null,
}

export const useQuizSessionStore = create<QuizSessionStore>((set) => ({
  resumePrompt: defaultResumePrompt,
  openResumePrompt: (payload) =>
    set({
      resumePrompt: {
        open: true,
        existingSession: payload.existingSession,
        onResume: payload.onResume,
        onRestart: payload.onRestart,
      },
    }),
  closeResumePrompt: () => set({ resumePrompt: defaultResumePrompt }),
  reset: () =>
    set({
      resumePrompt: defaultResumePrompt,
    }),
}))
