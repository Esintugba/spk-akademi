export enum SupportTicketCategory {
  LicenseAccess = 1,
  TechnicalIssue = 2,
  PdfIssue = 3,
  QuestionIssue = 4,
  ContentIssue = 5,
  AccountIssue = 6,
  Other = 7,
}

export enum SupportTicketPriority {
  Low = 1,
  Normal = 2,
  High = 3,
  Critical = 4,
}

export enum SupportTicketStatus {
  Open = 1,
  InProgress = 2,
  WaitingForUser = 3,
  Resolved = 4,
  Closed = 5,
}

export interface SupportTicketSummary {
  id: string
  ticketNumber: string
  category: SupportTicketCategory
  priority: SupportTicketPriority
  subject: string
  status: SupportTicketStatus
  createdAt: string
  updatedAt?: string | null
  closedAt?: string | null
  assignedAdminId?: string | null
  assignedAdminEmail?: string | null
  messageCount: number
  lastActivityAt: string
}

export interface SupportTicketMessage {
  id: string
  senderId: string
  senderName?: string | null
  senderEmail?: string | null
  isAdminReply: boolean
  message: string
  attachmentUrl?: string | null
  createdAt: string
}

export interface SupportTicketStatusHistory {
  id: string
  oldStatus?: SupportTicketStatus | null
  newStatus: SupportTicketStatus
  changedById?: string | null
  changedByEmail?: string | null
  note?: string | null
  createdAt: string
}

export interface SupportTicketDetail {
  id: string
  ticketNumber: string
  userId: string
  userEmail?: string | null
  userDisplayName?: string | null
  category: SupportTicketCategory
  priority: SupportTicketPriority
  subject: string
  description: string
  status: SupportTicketStatus
  assignedAdminId?: string | null
  assignedAdminEmail?: string | null
  createdAt: string
  updatedAt?: string | null
  closedAt?: string | null
  messages: SupportTicketMessage[]
  statusHistory: SupportTicketStatusHistory[]
}

export interface SupportTicketList {
  items: SupportTicketSummary[]
  totalCount: number
  page: number
  pageSize: number
}

export interface SupportTicketQuery {
  status?: SupportTicketStatus | ''
  category?: SupportTicketCategory | ''
  priority?: SupportTicketPriority | ''
  assignedAdminId?: string
  unassignedOnly?: boolean
  search?: string
  page?: number
  pageSize?: number
}

export interface StudentSupportDashboard {
  openTickets: number
  waitingForAdmin: number
  waitingForUser: number
  recentTickets: SupportTicketSummary[]
}

export interface AdminSupportDashboard {
  pendingTickets: number
  unassignedTickets: number
  openedToday: number
  criticalTickets: number
}

export const supportTicketCategories = [
  { value: SupportTicketCategory.LicenseAccess, label: 'Lisans Erisimi' },
  { value: SupportTicketCategory.TechnicalIssue, label: 'Teknik Sorun' },
  { value: SupportTicketCategory.PdfIssue, label: 'PDF Problemi' },
  { value: SupportTicketCategory.QuestionIssue, label: 'Soru Hatasi' },
  { value: SupportTicketCategory.ContentIssue, label: 'Icerik Hatasi' },
  { value: SupportTicketCategory.AccountIssue, label: 'Hesap Problemi' },
  { value: SupportTicketCategory.Other, label: 'Diger' },
] as const

export const supportTicketPriorities = [
  { value: SupportTicketPriority.Low, label: 'Dusuk' },
  { value: SupportTicketPriority.Normal, label: 'Normal' },
  { value: SupportTicketPriority.High, label: 'Yuksek' },
  { value: SupportTicketPriority.Critical, label: 'Kritik' },
] as const

export const supportTicketStatuses = [
  { value: SupportTicketStatus.Open, label: 'Acik' },
  { value: SupportTicketStatus.InProgress, label: 'Islemde' },
  { value: SupportTicketStatus.WaitingForUser, label: 'Kullanici Yaniti Bekliyor' },
  { value: SupportTicketStatus.Resolved, label: 'Cozuldu' },
  { value: SupportTicketStatus.Closed, label: 'Kapali' },
] as const

export function supportTicketCategoryLabel(value: SupportTicketCategory) {
  return supportTicketCategories.find((item) => item.value === value)?.label ?? 'Diger'
}

export function supportTicketPriorityLabel(value: SupportTicketPriority) {
  return supportTicketPriorities.find((item) => item.value === value)?.label ?? 'Normal'
}

export function supportTicketStatusLabel(value: SupportTicketStatus) {
  return supportTicketStatuses.find((item) => item.value === value)?.label ?? 'Acik'
}
