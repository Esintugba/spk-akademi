import type { CreateLicense, License, LicenseCatalog, Plan, UpdateLicense } from '../../models'
import { request } from './client'

export const licensesApi = {
  getAll: () => request.get<License[]>('/api/licenses', { skipAuth: true }),
  getCatalog: () => request.get<LicenseCatalog[]>('/api/licenses/catalog', { skipAuth: true }),
  getCatalogBySlug: (slug: string) => request.get<LicenseCatalog>(`/api/licenses/catalog/${slug}`, { skipAuth: true }),
  getById: (id: string) => request.get<LicenseCatalog>(`/api/licenses/${id}`),
  create: (payload: CreateLicense) => request.post<License>('/api/licenses', payload),
  update: (id: string, payload: UpdateLicense) => request.put<void>(`/api/licenses/${id}`, payload),
  delete: (id: string) => request.delete<void>(`/api/licenses/${id}`),
}

export const plansApi = {
  getAll: () => request.get<Plan[]>('/api/plans'),
  getById: (id: string) => request.get<Plan>(`/api/plans/${id}`),
}
