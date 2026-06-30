import type { DuplicateImportDecision, ImportJob, ImportPreview, MaterialImportPayload, MaterialImportResult, QuestionImportRow } from '../../models/import'
import { request } from './client'

function toFormData(file: File, duplicateActions?: DuplicateImportDecision[]) {
  const formData = new FormData()
  formData.append('file', file)
  if (duplicateActions && duplicateActions.length > 0) {
    formData.append('duplicateActionsJson', JSON.stringify(duplicateActions))
  }
  return formData
}

function toMaterialFormData(payload: MaterialImportPayload) {
  const formData = new FormData()
  formData.append('courseId', payload.courseId)
  if (payload.title?.trim()) {
    formData.append('title', payload.title.trim())
  }
  if (payload.sourceName?.trim()) {
    formData.append('sourceName', payload.sourceName.trim())
  }
  formData.append('file', payload.file)
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
  importMaterials: (payload: MaterialImportPayload) =>
    request.post<MaterialImportResult>('/api/admin/import/materials', toMaterialFormData(payload), {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getJob: (jobId: string) => request.get<ImportJob>(`/api/admin/import/jobs/${jobId}`),
}
