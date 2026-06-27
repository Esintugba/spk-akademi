import type {
  AccessRequestItem,
  AccessRequestQuery,
  AdminAccessRequestItem,
  AdminAccessRequestList,
  CreateAccessRequestPayload,
  UpdateAccessRequestStatusPayload,
} from '../../models/accessRequest'
import { request } from './client'

export const accessRequestApi = {
  create: (payload: CreateAccessRequestPayload) =>
    request.post<AccessRequestItem>('/api/access-requests', payload),
  getMy: () => request.get<AccessRequestItem[]>('/api/access-requests/my'),
  getAdminQueue: (params?: AccessRequestQuery) =>
    request.get<AdminAccessRequestList>('/api/admin/access-requests', { params }),
  updateStatus: (id: string, payload: UpdateAccessRequestStatusPayload) =>
    request.patch<AdminAccessRequestItem>(`/api/admin/access-requests/${id}/status`, payload),
}
