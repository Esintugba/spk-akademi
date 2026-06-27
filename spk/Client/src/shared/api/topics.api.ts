import type { CreateTopic, Topic, UpdateTopic } from '../../models'
import { request } from './client'

export const topicsApi = {
  getAll: (courseId?: string) => request.get<Topic[]>('/api/topics', { params: { courseId } }),
  getById: (id: string) => request.get<Topic>(`/api/topics/${id}`),
  create: (payload: CreateTopic) => request.post<Topic>('/api/topics', payload),
  update: (id: string, payload: UpdateTopic) => request.put<void>(`/api/topics/${id}`, payload),
  delete: (id: string) => request.delete<void>(`/api/topics/${id}`),
}
