import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CreateMaterialNote, MaterialHighlightColor } from '../../../models'
import { materialsApi, sourceDocumentsApi } from '../../../shared/api'

export const materialViewerQueryKeys = {
  viewer: (id: string) => ['materials', id, 'viewer'] as const,
  text: (id: string) => ['materials', id, 'text'] as const,
  notes: (id: string) => ['materials', id, 'notes'] as const,
  bookmarks: (id: string) => ['materials', id, 'bookmarks'] as const,
  missing: ['materials', 'missing'] as const,
}

export function useMaterialViewerInfo(materialId?: string) {
  return useQuery({
    queryKey: materialId ? materialViewerQueryKeys.viewer(materialId) : materialViewerQueryKeys.missing,
    queryFn: () => materialsApi.getViewerInfo(materialId as string),
    enabled: Boolean(materialId),
    retry: 1,
  })
}

export function useMaterialExtractedText(materialId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: materialId ? materialViewerQueryKeys.text(materialId) : [...materialViewerQueryKeys.missing, 'text'],
    queryFn: () => sourceDocumentsApi.getText(materialId as string),
    enabled: Boolean(materialId) && enabled,
    retry: 1,
    staleTime: 300_000,
  })
}

export function useMaterialNotes(materialId?: string) {
  return useQuery({
    queryKey: materialId ? materialViewerQueryKeys.notes(materialId) : [...materialViewerQueryKeys.missing, 'notes'],
    queryFn: () => materialsApi.getNotes(materialId as string),
    enabled: Boolean(materialId),
    retry: 1,
  })
}

export function useMaterialBookmarks(materialId?: string) {
  return useQuery({
    queryKey: materialId ? materialViewerQueryKeys.bookmarks(materialId) : [...materialViewerQueryKeys.missing, 'bookmarks'],
    queryFn: () => materialsApi.getBookmarks(materialId as string),
    enabled: Boolean(materialId),
    retry: 1,
  })
}

export function useSaveMaterialProgress(materialId: string | undefined, numPages: number) {
  return useMutation({
    mutationFn: (payload: { lastPage: number; secondsReadDelta: number }) =>
      materialsApi.saveProgress({
        materialId: materialId as string,
        lastPage: payload.lastPage,
        progressPercentage: numPages > 0 ? Math.round((payload.lastPage / numPages) * 1000) / 10 : 0,
        secondsReadDelta: payload.secondsReadDelta,
      }),
  })
}

export function useCreateMaterialBookmark(materialId: string | undefined, page: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () =>
      materialsApi.createBookmark(materialId as string, {
        pageNumber: page,
        title: `Sayfa ${page}`,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: materialViewerQueryKeys.bookmarks(materialId as string) })
    },
  })
}

export function useCreateMaterialNote({
  highlightColor,
  folderName,
  materialId,
  noteText,
  onSaved,
  page,
  selectedText,
  tags,
}: {
  folderName: string
  highlightColor: MaterialHighlightColor
  materialId: string | undefined
  noteText: string
  onSaved: () => void
  page: number
  selectedText: string | null
  tags: string[]
}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => {
      const payload: CreateMaterialNote = {
        pageNumber: page,
        selectedText,
        note: noteText.trim(),
        highlightColor,
        folderName: folderName.trim() || null,
        tags,
      }
      return materialsApi.createNote(materialId as string, payload)
    },
    onSuccess: async () => {
      onSaved()
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: materialViewerQueryKeys.notes(materialId as string) }),
        queryClient.invalidateQueries({ queryKey: ['student-content', 'notes'] }),
      ])
    },
  })
}
