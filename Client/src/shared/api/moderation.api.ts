import type { ModerateContentRequest, ModerationContentType, ModerationHistoryItem, ModerationListResponse } from '../../models'
import { request } from './client'

export const moderationApi = {
  getItems: (params?: {
    contentType?: ModerationContentType
    reviewStatus?: number
    search?: string
    page?: number
    pageSize?: number
  }) => request.get<ModerationListResponse>('/api/moderation/items', { params }),
  getHistory: (contentType: ModerationContentType, contentId: string) =>
    request.get<ModerationHistoryItem[]>('/api/moderation/history', { params: { contentType, contentId } }),
  review: (payload: ModerateContentRequest) => request.post<void>('/api/moderation/review', payload),
  bulkReview: (items: ModerateContentRequest[]) => request.post<void>('/api/moderation/bulk-review', { items }),
}
