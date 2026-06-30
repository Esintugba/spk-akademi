import type { DuplicateImportDecision, ImportJob, ImportPreview, QuestionImportRow } from '../../models/import'
import { request } from './client'

function toFormData(file: File, duplicateActions?: DuplicateImportDecision[]) {
  const formData = new FormData()
  formData.append('file', file)
  if (duplicateActions && duplicateActions.length > 0) {
    formData.append('duplicateActionsJson', JSON.stringify(duplicateActions))
  }
  return formData
}

export const importApi = {
  previewQuestions: (file: File) =>
    request.post<ImportPreview>('/api/admin/import/preview', toFormData(file), {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  importQuestions: (file: File, duplicateActions?: DuplicateImportDecision[]) =>
    request.post<ImportJob>('/api/admin/import/questions', toFormData(file, duplicateActions), {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  duplicateCheck: (rows: QuestionImportRow[]) =>
    request.post<ImportPreview>('/api/admin/import/duplicate-check', { rows }),
  getJob: (jobId: string) => request.get<ImportJob>(`/api/admin/import/jobs/${jobId}`),
}
