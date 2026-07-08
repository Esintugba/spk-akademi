import type { AuthUser, LoginResponse } from '../../models'

const legacyAccessTokenKey = 'spk_access_token'
const legacyRefreshTokenKey = 'spk_refresh_token'
const legacyRefreshTokenExpiresAtKey = 'spk_refresh_token_expires_at'
const legacyUserRoleKey = 'spk_user_role'
const legacyUserEmailKey = 'spk_user_email'
const legacyTokenExpiresAtKey = 'spk_token_expires_at'

let currentUser: AuthUser | null = null

function parseRefreshTokenExpiresAt(response: LoginResponse) {
  if (!response.refreshTokenExpiresAt) {
    return undefined
  }

  const parsed = Date.parse(response.refreshTokenExpiresAt)
  return Number.isFinite(parsed) ? parsed : undefined
}

function clearLegacyAuthStorage() {
  localStorage.removeItem(legacyAccessTokenKey)
  localStorage.removeItem(legacyRefreshTokenKey)
  localStorage.removeItem(legacyRefreshTokenExpiresAtKey)
  localStorage.removeItem(legacyUserRoleKey)
  localStorage.removeItem(legacyUserEmailKey)
  localStorage.removeItem(legacyTokenExpiresAtKey)
}

export function createAuthUser(response: LoginResponse): AuthUser {
  return {
    email: response.email,
    expiresAt: Date.now() + response.expiresIn * 1000,
    refreshTokenExpiresAt: parseRefreshTokenExpiresAt(response),
    role: response.role,
    token: response.accessToken,
  }
}

export function getStoredUser(): AuthUser | null {
  return currentUser
}

export function saveStoredUser(user: AuthUser) {
  currentUser = user
  clearLegacyAuthStorage()
}

export function updateStoredTokens(response: LoginResponse): AuthUser {
  const updatedUser = createAuthUser(response)
  saveStoredUser(updatedUser)

  return updatedUser
}

export function clearStoredUser() {
  currentUser = null
  clearLegacyAuthStorage()
}

export function isAccessTokenExpired(user: AuthUser, skewMilliseconds = 30000) {
  return user.expiresAt <= Date.now() + skewMilliseconds
}

export function isRefreshTokenExpired(user: AuthUser, skewMilliseconds = 30000) {
  return typeof user.refreshTokenExpiresAt === 'number' && user.refreshTokenExpiresAt <= Date.now() + skewMilliseconds
}
