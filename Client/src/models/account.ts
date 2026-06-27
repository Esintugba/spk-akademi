export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  kvkkAccepted: boolean
  commercialElectronicMessages?: boolean
  consentVersion?: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  email: string
  newPassword: string
  token: string
}

export interface LoginResponse {
  accessToken: string
  expiresIn: number
  refreshToken: string
  role: 'Admin' | 'Student'
  tokenType?: string
}

export interface AuthUser {
  email: string
  expiresAt: number
  refreshToken: string
  role: 'Admin' | 'Student'
  token: string
}
