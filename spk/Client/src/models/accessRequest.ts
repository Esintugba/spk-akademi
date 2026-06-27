export enum AccessRequestStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
  Waitlisted = 3,
  Cancelled = 4,
}

export interface AccessRequestItem {
  id: string
  planId: string
  planName: string
  status: AccessRequestStatus
  requestedAt: string
  message: string | null
  adminNote: string | null
  reviewedAt: string | null
  emailSent: boolean
}

export interface CreateAccessRequestPayload {
  planId: string
  message?: string
}

export interface AdminAccessRequestItem extends AccessRequestItem {
  studentId: string
  studentEmail: string
  studentDisplayName: string | null
  reviewedByEmail: string | null
}

export interface AdminAccessRequestList {
  items: AdminAccessRequestItem[]
  totalCount: number
  page: number
  pageSize: number
}

export interface AccessRequestQuery {
  status?: AccessRequestStatus
  planId?: string
  userId?: string
  reviewed?: boolean
  requestedFrom?: string
  requestedTo?: string
  page?: number
  pageSize?: number
}

export interface UpdateAccessRequestStatusPayload {
  status: AccessRequestStatus
  adminNote?: string
}
