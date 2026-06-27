export type AccessSource = 1 | 2 | 3 | 4 | 5

export interface UserSummary {
  id: string
  email: string
  displayName: string
  roles: string[]
}

export interface UserLicenseAccess {
  id: string
  userId: string
  userEmail: string
  licenseId: string
  licenseName: string
  startDate: string
  endDate?: string | null
  isActive: boolean
  isCurrentlyActive: boolean
  accessSource: AccessSource
  createdAt: string
}

export interface MyLicenseAccess {
  licenseId: string
  licenseName: string
  hasAccess: boolean
  startDate?: string | null
  endDate?: string | null
  accessSource?: AccessSource | null
  isDemoAccess?: boolean
  grantedAutomatically?: boolean
  expiresAt?: string | null
}

export interface CreateUserLicenseAccess {
  userId: string
  licenseId: string
  startDate: string
  endDate?: string | null
  isActive: boolean
  accessSource: AccessSource
}

export interface UpdateUserLicenseAccess {
  startDate: string
  endDate?: string | null
  isActive: boolean
  accessSource: AccessSource
}
