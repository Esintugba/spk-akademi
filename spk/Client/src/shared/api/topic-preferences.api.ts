import type { TopicPreference, UpdateTopicPreference } from '../../models'
import { request } from './client'

export const topicPreferencesApi = {
  getAll: () => request.get<TopicPreference[]>('/api/topic-preferences'),
  update: (topicId: string, payload: UpdateTopicPreference) =>
    request.patch<TopicPreference>(`/api/topic-preferences/${topicId}`, payload),
}
