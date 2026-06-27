import type { Course, CreateCourse, UpdateCourse } from '../../models'
import { request } from './client'

export const coursesApi = {
  getAll: (licenseId?: string) => request.get<Course[]>('/api/courses', { params: { licenseId } }),
  getById: (id: string) => request.get<Course>(`/api/courses/${id}`),
  create: (payload: CreateCourse) => request.post<Course>('/api/courses', payload),
  update: (id: string, payload: UpdateCourse) => request.put<void>(`/api/courses/${id}`, payload),
  delete: (id: string) => request.delete<void>(`/api/courses/${id}`),
}
