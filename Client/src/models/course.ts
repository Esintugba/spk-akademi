export interface Course {
  id: string
  licenseId: string
  name: string
  slug: string
  description?: string | null
  order: number
  topicCount: number
}

export interface CreateCourse {
  licenseId: string
  name: string
  slug: string
  description?: string | null
  order: number
}

export type UpdateCourse = CreateCourse
