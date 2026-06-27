export interface TopicPreference {
  topicId: string
  isFavorite: boolean
  isInWeeklyPlan: boolean
  updatedAt?: string | null
}

export interface UpdateTopicPreference {
  isFavorite?: boolean | null
  isInWeeklyPlan?: boolean | null
}
