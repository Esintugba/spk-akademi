import { create } from 'zustand'

interface AccessRequestModalState {
  open: boolean
  planId: string | null
  planName: string | null
  openModal: (planId: string, planName: string) => void
  closeModal: () => void
}

export const useAccessRequestStore = create<AccessRequestModalState>((set) => ({
  open: false,
  planId: null,
  planName: null,
  openModal: (planId, planName) => set({ open: true, planId, planName }),
  closeModal: () => set({ open: false, planId: null, planName: null }),
}))
