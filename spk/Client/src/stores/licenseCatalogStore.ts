import { create } from 'zustand'

interface LicenseCatalogState {
  compareIds: string[]
  toggleCompare: (licenseId: string) => void
  clearCompare: () => void
}

export const useLicenseCatalogStore = create<LicenseCatalogState>((set) => ({
  compareIds: [],
  toggleCompare: (licenseId) =>
    set((state) => ({
      compareIds: state.compareIds.includes(licenseId)
        ? state.compareIds.filter((id) => id !== licenseId)
        : [...state.compareIds, licenseId].slice(-3),
    })),
  clearCompare: () => set({ compareIds: [] }),
}))
