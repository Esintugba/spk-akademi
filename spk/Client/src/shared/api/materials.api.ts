import type {
  CreateMaterialBookmark,
  CreateMaterialNote,
  MaterialBookmark,
  MaterialLibraryItem,
  MaterialNote,
  MaterialProgressRequest,
  MaterialViewer,
  MyMaterialNote,
  ReadingAnalytics,
  ReadingHistoryItem,
  ReviewMaterialNote,
  MaterialNoteReviewResult,
  UpdateMaterialNote,
} from '../../models'
import { request } from './client'

export const materialsApi = {
  getViewerInfo: (materialId: string) => request.get<MaterialViewer>(`/api/materials/${materialId}/viewer-info`),
  streamPdfUrl: (materialId: string, token: string) => `/api/materials/${materialId}/viewer?token=${encodeURIComponent(token)}`,
  saveProgress: (payload: MaterialProgressRequest) => request.post<void>('/api/materials/progress', payload),
  getBookmarks: (materialId: string) => request.get<MaterialBookmark[]>(`/api/materials/${materialId}/bookmarks`),
  createBookmark: (materialId: string, payload: CreateMaterialBookmark) =>
    request.post<MaterialBookmark>(`/api/materials/${materialId}/bookmarks`, payload),
  deleteBookmark: (bookmarkId: string) => request.delete<void>(`/api/materials/bookmarks/${bookmarkId}`),
  getNotes: (materialId: string) => request.get<MaterialNote[]>(`/api/materials/${materialId}/notes`),
  createNote: (materialId: string, payload: CreateMaterialNote) =>
    request.post<MaterialNote>(`/api/materials/${materialId}/notes`, payload),
  updateNote: (noteId: string, payload: UpdateMaterialNote) => request.patch<void>(`/api/materials/notes/${noteId}`, payload),
  deleteNote: (noteId: string) => request.delete<void>(`/api/materials/notes/${noteId}`),
  getReadingHistory: (params?: { take?: number }) => request.get<ReadingHistoryItem[]>('/api/materials/reading-history', { params }),
  getReadingAnalytics: () => request.get<ReadingAnalytics>('/api/materials/reading-analytics'),
  getLibrary: (params?: { take?: number }) => request.get<MaterialLibraryItem[]>('/api/materials/library', { params }),
  getMyNotes: (params?: { take?: number }) => request.get<MyMaterialNote[]>('/api/materials/notes', { params }),
  getDueNoteReviews: (params?: { take?: number }) =>
    request.get<ReviewMaterialNote[]>('/api/materials/note-reviews', { params }),
  reviewNote: (noteId: string, quality: number) =>
    request.post<MaterialNoteReviewResult>(`/api/materials/notes/${noteId}/review`, { quality }),
}
