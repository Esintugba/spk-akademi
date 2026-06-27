import type { SourceDocument, SourceDocumentText } from '../../models'
import { request } from './client'

export const sourceDocumentsApi = {
  getAll: (courseId?: string) => request.get<SourceDocument[]>('/api/source-documents', { params: { courseId } }),
  upload: (payload: FormData) =>
    request.post<SourceDocument>('/api/source-documents/upload', payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  replaceFile: (id: string, payload: FormData) =>
    request.put<SourceDocument>(`/api/source-documents/${id}/upload`, payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  extractText: (id: string) => request.post<SourceDocumentText>(`/api/source-documents/${id}/extract-text`),
  getText: (id: string) => request.get<SourceDocumentText>(`/api/source-documents/${id}/text`),
  download: (id: string) => request.get<Blob>(`/api/source-documents/${id}/download`, { responseType: 'blob' }),
  delete: (id: string) => request.delete<void>(`/api/source-documents/${id}`),
}
