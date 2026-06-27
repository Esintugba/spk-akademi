export enum ContactMessageStatus {
  Pending = 0,
  Read = 1,
  InProgress = 2,
  Resolved = 3,
  Closed = 4,
  Spam = 5,
}

export interface CreateContactMessagePayload {
  name: string
  email: string
  subject: string
  message: string
  kvkkAccepted: boolean
  commercialElectronicMessages: boolean
  website?: string
  captchaToken?: string
}

export interface ContactMessageResponse {
  id: string
  message: string
}

export interface AdminContactMessage {
  id: string
  name: string
  email: string
  subject: string
  message: string
  status: ContactMessageStatus
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  readAt: string | null
  repliedAt: string | null
  assignedToUserId: string | null
  assignedToEmail: string | null
  adminNote: string | null
}

export interface AdminContactMessageList {
  items: AdminContactMessage[]
  totalCount: number
  page: number
  pageSize: number
  unreadCount: number
}

export interface ContactMessageQuery {
  status?: ContactMessageStatus
  unreadOnly?: boolean
  createdFrom?: string
  createdTo?: string
  email?: string
  search?: string
  page?: number
  pageSize?: number
}

export interface UpdateContactMessageStatusPayload {
  status: ContactMessageStatus
  adminNote?: string
  assignedToUserId?: string
}
