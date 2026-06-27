export enum TopicType {
  MainTopic = 1,
  SubTopic = 2,
}

export interface Topic {
  id: string
  courseId: string
  parentTopicId?: string | null
  parentTopicTitle?: string | null
  type: TopicType
  title: string
  slug: string
  order: number
  level?: number
  summary?: string | null
  importantPoints?: string | null
  commonMistakes?: string | null
  formulas?: string | null
  examNotes?: string | null
  criticalThresholds?: string | null
  subTopicCount?: number
  questionCount: number
}

export interface CreateTopic {
  courseId: string
  parentTopicId?: string | null
  type?: TopicType | null
  title: string
  slug: string
  order: number
  summary?: string | null
  importantPoints?: string | null
  commonMistakes?: string | null
  formulas?: string | null
  examNotes?: string | null
  criticalThresholds?: string | null
}

export type UpdateTopic = CreateTopic
