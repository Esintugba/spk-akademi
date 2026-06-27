import { create } from 'zustand'

type CelebrationType = 'badge' | 'level' | 'task'

export interface CelebrationNotice {
  id: string
  type: CelebrationType
  title: string
  description: string
}

interface GamificationStoreState {
  notices: CelebrationNotice[]
  enqueueNotice: (notice: CelebrationNotice) => void
  dismissNotice: (id: string) => void
}

export const useGamificationStore = create<GamificationStoreState>((set) => ({
  notices: [],
  enqueueNotice: (notice) =>
    set((state) => ({
      notices: [...state.notices, notice],
    })),
  dismissNotice: (id) =>
    set((state) => ({
      notices: state.notices.filter((notice) => notice.id !== id),
    })),
}))
