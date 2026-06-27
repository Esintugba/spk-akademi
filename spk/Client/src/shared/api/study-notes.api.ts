import type { CreateStudyNote, PublicStudyNote, StudyNote, UpdateStudyNote } from '../../models'
import { request } from './client'

export const studyNotesApi = {
  getAll: (topicId?: string) => request.get<StudyNote[]>('/api/study-notes', { params: { topicId } }),
  getPublic: (params?: { courseId?: string; licenseId?: string; search?: string; topicId?: string }) =>
    request.get<PublicStudyNote[]>('/api/study-notes/public', { params }),
  getById: (id: string) => request.get<StudyNote>(`/api/study-notes/${id}`),
  create: (payload: CreateStudyNote) => request.post<StudyNote>('/api/study-notes', payload),
  update: (id: string, payload: UpdateStudyNote) => request.put<void>(`/api/study-notes/${id}`, payload),
  delete: (id: string) => request.delete<void>(`/api/study-notes/${id}`),
}
