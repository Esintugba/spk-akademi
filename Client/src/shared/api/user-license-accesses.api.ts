import type { CreateUserLicenseAccess, MyLicenseAccess, UpdateUserLicenseAccess, UserLicenseAccess, UserSummary } from '../../models'
import { request } from './client'

export const userLicenseAccessesApi = {
  getMine: () => request.get<MyLicenseAccess[]>('/api/user-license-accesses/me'),
  getUsers: () => request.get<UserSummary[]>('/api/user-license-accesses/users'),
  getAll: () => request.get<UserLicenseAccess[]>('/api/user-license-accesses'),
  create: (payload: CreateUserLicenseAccess) => request.post<UserLicenseAccess>('/api/user-license-accesses', payload),
  update: (id: string, payload: UpdateUserLicenseAccess) => request.put<void>(`/api/user-license-accesses/${id}`, payload),
  delete: (id: string) => request.delete<void>(`/api/user-license-accesses/${id}`),
}
