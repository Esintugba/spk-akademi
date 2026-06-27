import type { ImportJob, ImportPreview } from '../../models/import'
import { request } from './client'

function toFormData(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return formData
}

export const importApi = {
  previewQuestions: (file: File) =>
    request.post<ImportPreview>('/api/admin/import/preview', toFormData(file), {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  importQuestions: (file: File) =>
    request.post<ImportJob>('/api/admin/import/questions', toFormData(file), {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getJob: (jobId: string) => request.get<ImportJob>(`/api/admin/import/jobs/${jobId}`),
}
