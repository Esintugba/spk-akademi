import { create } from 'zustand'
import type { ReviewSessionResponse, SubmitReviewAnswer } from '../models/review'

interface ReviewAnswerState {
  selectedOptionId: string | null
  quality: number | null
  startedAtMs: number
  responseTimeSeconds?: number
}

interface ReviewStore {
  activeSession: ReviewSessionResponse | null
  currentIndex: number
  answerStates: Record<string, ReviewAnswerState>
  pendingAnswers: SubmitReviewAnswer[]
  setActiveSession: (session: ReviewSessionResponse | null) => void
  setCurrentIndex: (index: number) => void
  setSelectedOption: (questionId: string, optionId: string) => void
  setQuality: (questionId: string, quality: number) => void
  commitCurrentAnswer: () => void
  clearSession: () => void
}

export const useReviewStore = create<ReviewStore>((set, get) => ({
  activeSession: null,
  currentIndex: 0,
  answerStates: {},
  pendingAnswers: [],
  setActiveSession: (session) =>
    set({
      activeSession: session,
      currentIndex: 0,
      answerStates: {},
      pendingAnswers: [],
    }),
  setCurrentIndex: (index) => set({ currentIndex: index }),
  setSelectedOption: (questionId, optionId) =>
    set((state) => ({
      answerStates: {
        ...state.answerStates,
        [questionId]: {
          selectedOptionId: optionId,
          quality: state.answerStates[questionId]?.quality ?? null,
          startedAtMs: state.answerStates[questionId]?.startedAtMs ?? Date.now(),
        },
      },
    })),
  setQuality: (questionId, quality) =>
    set((state) => ({
      answerStates: {
        ...state.answerStates,
        [questionId]: {
          selectedOptionId: state.answerStates[questionId]?.selectedOptionId ?? null,
          quality,
          startedAtMs: state.answerStates[questionId]?.startedAtMs ?? Date.now(),
        },
      },
    })),
  commitCurrentAnswer: () => {
    const { activeSession, currentIndex, answerStates, pendingAnswers } = get()
    if (!activeSession) {
      return
    }

    const question = activeSession.questions[currentIndex]
    if (!question) {
      return
    }

    const state = answerStates[question.questionId]
    if (state?.quality == null) {
      return
    }

    const responseTimeSeconds = Math.max(
      1,
      Math.round((Date.now() - state.startedAtMs) / 1000),
    )

    const answeredCorrect = state.quality >= 3
    const answer: SubmitReviewAnswer = {
      questionId: question.questionId,
      quality: state.quality,
      answeredCorrect,
      responseTimeSeconds,
    }

    const filtered = pendingAnswers.filter((x) => x.questionId !== question.questionId)
    set({
      pendingAnswers: [...filtered, answer],
      currentIndex: Math.min(currentIndex + 1, activeSession.questions.length),
    })
  },
  clearSession: () =>
    set({
      activeSession: null,
      currentIndex: 0,
      answerStates: {},
      pendingAnswers: [],
    }),
}))

export const QUALITY_OPTIONS = [
  { quality: 5, label: 'Kolaydı' },
  { quality: 4, label: 'Biraz düşündüm' },
  { quality: 3, label: 'Zordu ama yaptım' },
  { quality: 1, label: 'Yanlış yaptım' },
  { quality: 0, label: 'Hiç bilmiyordum' },
] as const
