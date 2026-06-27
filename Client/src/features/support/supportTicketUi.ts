import type { ChipProps } from '@mui/material'
import {
  SupportTicketPriority,
  SupportTicketStatus,
  supportTicketCategoryLabel,
  supportTicketPriorityLabel,
  supportTicketStatusLabel,
} from '../../models'

export function formatSupportDate(value?: string | null) {
  if (!value) {
    return '-'
  }

  return new Date(value).toLocaleString('tr-TR', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  })
}

export function supportStatusColor(status: SupportTicketStatus): ChipProps['color'] {
  switch (status) {
    case SupportTicketStatus.Open:
      return 'info'
    case SupportTicketStatus.InProgress:
      return 'primary'
    case SupportTicketStatus.WaitingForUser:
      return 'warning'
    case SupportTicketStatus.Resolved:
      return 'success'
    case SupportTicketStatus.Closed:
      return 'default'
    default:
      return 'default'
  }
}

export function supportPriorityColor(priority: SupportTicketPriority): ChipProps['color'] {
  switch (priority) {
    case SupportTicketPriority.Critical:
      return 'error'
    case SupportTicketPriority.High:
      return 'warning'
    case SupportTicketPriority.Normal:
      return 'primary'
    default:
      return 'default'
  }
}

export {
  supportTicketCategoryLabel,
  supportTicketPriorityLabel,
  supportTicketStatusLabel,
}
