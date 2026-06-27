export interface PlanScopeSummary {
  courseCount: number
  topicCount: number
  questionCount: number
  quizCount: number
  materialCount: number
  estimatedStudyHours: number
}

export interface PlanLicenseSummary {
  id: string
  name: string
  slug: string
  courseCount: number
  topicCount: number
  questionCount: number
  quizCount: number
  materialCount: number
  estimatedStudyHours: number
  hasAccess: boolean
}

export interface Plan {
  id: string
  name: string
  slug: string
  description?: string | null
  shortDescription?: string | null
  displayOrder: number
  isFeatured: boolean
  isActive: boolean
  hasAccess: boolean
  activeLicenseCount: number
  scope: PlanScopeSummary
  licenses: PlanLicenseSummary[]
}
