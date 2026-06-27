export interface License {
  id: string
  name: string
  slug: string
  description?: string | null
  shortDescription?: string | null
  iconUrl?: string | null
  displayOrder: number
  estimatedStudyHours: number
  isFeatured: boolean
  isActive: boolean
  courseCount: number
}

export interface CreateLicense {
  name: string
  slug: string
  description?: string | null
  shortDescription?: string | null
  iconUrl?: string | null
  displayOrder?: number
  estimatedStudyHours?: number
  isFeatured?: boolean
  isActive?: boolean
}

export type UpdateLicense = CreateLicense

export interface LicenseCourseSummary {
  id: string
  name: string
  slug: string
  description?: string | null
  displayOrder: number
  topicCount: number
  questionCount: number
  materialCount: number
}

export interface LicenseQuizSummary {
  id: string
  title: string
  slug: string
  questionCount: number
  duration: number
}

export interface LicenseCatalogAnalytics {
  enrolledStudentCount: number
  activeStudentCount: number
  averageScore: number
}

export interface LicenseCatalog {
  id: string
  name: string
  slug: string
  description?: string | null
  shortDescription?: string | null
  iconUrl?: string | null
  displayOrder: number
  courseCount: number
  topicCount: number
  questionCount: number
  quizCount: number
  materialCount: number
  estimatedStudyHours: number
  isActive: boolean
  isFeatured: boolean
  hasAccess: boolean
  courses: LicenseCourseSummary[]
  quizzes: LicenseQuizSummary[]
  analytics: LicenseCatalogAnalytics
}
