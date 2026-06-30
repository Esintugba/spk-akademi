import { create } from 'zustand'

export interface AccessRequestLicenseSummary {
  id: string
  name: string
  courseCount?: number
  topicCount?: number
  questionCount?: number
}

export interface AccessRequestScopeSummary {
  courseCount?: number
  topicCount?: number
  questionCount?: number
  quizCount?: number
  materialCount?: number
  estimatedStudyHours?: number
}

export interface AccessRequestContext {
  planId: string
  planName: string
  planDescription?: string | null
  licenses?: AccessRequestLicenseSummary[]
  scope?: AccessRequestScopeSummary
  requestedLicenseName?: string | null
}

interface AccessRequestModalState {
  open: boolean
  planId: string | null
  planName: string | null
  planDescription: string | null
  licenses: AccessRequestLicenseSummary[]
  scope: AccessRequestScopeSummary | null
  requestedLicenseName: string | null
  openModal: (context: AccessRequestContext) => void
  closeModal: () => void
}

export const useAccessRequestStore = create<AccessRequestModalState>((set) => ({
  open: false,
  planId: null,
  planName: null,
  planDescription: null,
  licenses: [],
  scope: null,
  requestedLicenseName: null,
  openModal: (context) =>
    set({
      open: true,
      planId: context.planId,
      planName: context.planName,
      planDescription: context.planDescription ?? null,
      licenses: context.licenses ?? [],
      scope: context.scope ?? null,
      requestedLicenseName: context.requestedLicenseName ?? null,
    }),
  closeModal: () =>
    set({
      open: false,
      planId: null,
      planName: null,
      planDescription: null,
      licenses: [],
      scope: null,
      requestedLicenseName: null,
    }),
}))
