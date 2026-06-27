import type {
  AccountProfile,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  ResetPasswordRequest,
  UpdateAccountProfile,
} from '../../models'
import { request } from './client'

export const authApi = {
  register: (payload: RegisterRequest) => request.post<void>('/api/account/register', payload),
  login: (payload: LoginRequest) => request.post<LoginResponse>('/api/account/login', payload),
  forgotPassword: (payload: ForgotPasswordRequest) => request.post<void>('/api/account/forgot-password', payload, { skipAuth: true }),
  resetPassword: (payload: ResetPasswordRequest) => request.post<void>('/api/account/reset-password', payload, { skipAuth: true }),
  getMyProfile: () => request.get<AccountProfile>('/api/account/me'),
  updateMyProfile: (payload: UpdateAccountProfile) => request.put<void>('/api/account/profile', payload),
  changePassword: (payload: ChangePasswordRequest) => request.post<void>('/api/account/change-password', payload),
  logoutAllSessions: () => request.post<void>('/api/account/logout-all'),
}
