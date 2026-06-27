import type {
  AdminContactMessage,
  AdminContactMessageList,
  ContactMessageQuery,
  ContactMessageResponse,
  CreateContactMessagePayload,
  UpdateContactMessageStatusPayload,
} from '../../models/contact'
import { request } from './client'

export const contactApi = {
  create: (payload: CreateContactMessagePayload) =>
    request.post<ContactMessageResponse>('/api/contact', payload),
  getAdminMessages: (params?: ContactMessageQuery) =>
    request.get<AdminContactMessageList>('/api/admin/contact-messages', { params }),
  getAdminMessage: (id: string) =>
    request.get<AdminContactMessage>(`/api/admin/contact-messages/${id}`),
  updateStatus: (id: string, payload: UpdateContactMessageStatusPayload) =>
    request.patch<AdminContactMessage>(`/api/admin/contact-messages/${id}/status`, payload),
}
