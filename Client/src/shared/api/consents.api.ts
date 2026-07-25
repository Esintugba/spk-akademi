import type { ConsentSummary, CookieConsent } from '../../models'
import { request } from './client'

export const consentsApi = {
  saveCookie: (payload: CookieConsent) =>
    request.post<void>('/api/consents/cookie', payload, { skipAuth: true }),
  saveKvkk: (payload: { consentType: string; kvkkAccepted: boolean; commercialElectronicMessages: boolean; version?: string }) =>
    request.post<void>('/api/consents/kvkk', payload, { skipAuth: true }),
  getAdminSummary: () => request.get<ConsentSummary>('/api/admin/consents'),
}
