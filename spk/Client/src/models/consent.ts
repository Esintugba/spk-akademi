export interface CookieConsent {
  necessary: boolean
  analytics: boolean
  marketing: boolean
  version: string
}

export interface ConsentSummary {
  cookieAcceptedCount: number
  cookieRejectedCount: number
  lastCookieConsentAt?: string | null
  kvkkConsentCount: number
  lastKvkkConsentAt?: string | null
  recentConsents: ConsentLog[]
}

export interface ConsentLog {
  id: string
  userId?: string | null
  consentType: string
  ipAddress?: string | null
  createdAt: string
  version: string
  analytics: boolean
  marketing: boolean
  kvkkAccepted: boolean
  commercialElectronicMessages: boolean
}
