import { AccessRequestStatus } from '../../models/accessRequest'

export function accessRequestStatusLabel(status: AccessRequestStatus) {
  switch (status) {
    case AccessRequestStatus.Approved:
      return 'Onaylandı'
    case AccessRequestStatus.Rejected:
      return 'Reddedildi'
    case AccessRequestStatus.Waitlisted:
      return 'Bekleme listesi'
    case AccessRequestStatus.Cancelled:
      return 'İptal'
    default:
      return 'Beklemede'
  }
}

export function accessRequestStatusColor(
  status: AccessRequestStatus,
): 'default' | 'success' | 'error' | 'warning' | 'info' {
  switch (status) {
    case AccessRequestStatus.Approved:
      return 'success'
    case AccessRequestStatus.Rejected:
      return 'error'
    case AccessRequestStatus.Waitlisted:
      return 'info'
    case AccessRequestStatus.Pending:
      return 'warning'
    default:
      return 'default'
  }
}
