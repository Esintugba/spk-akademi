import type {
  AdminSupportDashboard,
  StudentSupportDashboard,
  SupportTicketDetail,
  SupportTicketList,
  SupportTicketQuery,
  SupportTicketSummary,
} from '../../models'
import { request } from './client'

function cleanParams(params?: SupportTicketQuery) {
  if (!params) {
    return undefined
  }

  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null),
  )
}

const formConfig = {
  headers: { 'Content-Type': 'multipart/form-data' },
}

export const supportTicketsApi = {
  getMy: () => request.get<SupportTicketSummary[]>('/api/support/tickets/my'),
  getMySummary: () => request.get<StudentSupportDashboard>('/api/support/tickets/dashboard-summary'),
  create: (payload: FormData) => request.post<SupportTicketDetail>('/api/support/tickets', payload, formConfig),
  getMineById: (id: string) => request.get<SupportTicketDetail>(`/api/support/tickets/${id}`),
  addUserMessage: (id: string, payload: FormData) =>
    request.post<SupportTicketDetail>(`/api/support/tickets/${id}/messages`, payload, formConfig),
  getAdmin: (params?: SupportTicketQuery) =>
    request.get<SupportTicketList>('/api/admin/support-tickets', { params: cleanParams(params) }),
  getAdminSummary: () => request.get<AdminSupportDashboard>('/api/admin/support-tickets/dashboard-summary'),
  getAdminById: (id: string) => request.get<SupportTicketDetail>(`/api/admin/support-tickets/${id}`),
  addAdminMessage: (id: string, payload: FormData) =>
    request.post<SupportTicketDetail>(`/api/admin/support-tickets/${id}/messages`, payload, formConfig),
  updateAdmin: (id: string, payload: { status?: number; priority?: number; assignedAdminId?: string | null; note?: string }) =>
    request.put<SupportTicketDetail>(`/api/admin/support-tickets/${id}`, payload),
}
