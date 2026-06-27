import type { AdminDashboard } from '../../models'
import { request } from './client'

export const dashboardApi = {
  getAdminDashboard: () => request.get<AdminDashboard>('/api/admin/dashboard'),
}
