import type { AuthUser, LoginResponse } from '../../models'

const accessTokenKey = 'spk_access_token'
const refreshTokenKey = 'spk_refresh_token'
const refreshTokenExpiresAtKey = 'spk_refresh_token_expires_at'
const userRoleKey = 'spk_user_role'
const userEmailKey = 'spk_user_email'
const tokenExpiresAtKey = 'spk_token_expires_at'

function parseOptionalTimestamp(value: string | null) {
  if (!value) {
    return undefined
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function parseRefreshTokenExpiresAt(response: LoginResponse) {
  if (!response.refreshTokenExpiresAt) {
    return undefined
  }

  const parsed = Date.parse(response.refreshTokenExpiresAt)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function createAuthUser(email: string, response: LoginResponse): AuthUser {
  return {
    email,
    expiresAt: Date.now() + response.expiresIn * 1000,
    refreshToken: response.refreshToken,
    refreshTokenExpiresAt: parseRefreshTokenExpiresAt(response),
    role: response.role,
    token: response.accessToken,
  }
}

export function getStoredUser(): AuthUser | null {
  const email = localStorage.getItem(userEmailKey)
  const token = localStorage.getItem(accessTokenKey)
  const refreshToken = localStorage.getItem(refreshTokenKey)
  const role = localStorage.getItem(userRoleKey)
  const expiresAt = Number(localStorage.getItem(tokenExpiresAtKey))
  const refreshTokenExpiresAt = parseOptionalTimestamp(localStorage.getItem(refreshTokenExpiresAtKey))

  if (!email || !token || !refreshToken || (role !== 'Admin' && role !== 'Student') || !Number.isFinite(expiresAt)) {
    clearStoredUser()
    return null
  }

  return {
    email,
    expiresAt,
    refreshToken,
    refreshTokenExpiresAt,
    role,
    token,
  }
}

export function saveStoredUser(user: AuthUser) {
  localStorage.setItem(accessTokenKey, user.token)
  localStorage.setItem(refreshTokenKey, user.refreshToken)
  if (user.refreshTokenExpiresAt) {
    localStorage.setItem(refreshTokenExpiresAtKey, user.refreshTokenExpiresAt.toString())
  } else {
    localStorage.removeItem(refreshTokenExpiresAtKey)
  }
  localStorage.setItem(userRoleKey, user.role)
  localStorage.setItem(userEmailKey, user.email)
  localStorage.setItem(tokenExpiresAtKey, user.expiresAt.toString())
}

export function updateStoredTokens(response: LoginResponse): AuthUser | null {
  const currentUser = getStoredUser()

  if (!currentUser) {
    return null
  }

  const updatedUser = createAuthUser(currentUser.email, response)
  saveStoredUser(updatedUser)

  return updatedUser
}

export function clearStoredUser() {
  localStorage.removeItem(accessTokenKey)
  localStorage.removeItem(refreshTokenKey)
  localStorage.removeItem(refreshTokenExpiresAtKey)
  localStorage.removeItem(userRoleKey)
  localStorage.removeItem(userEmailKey)
  localStorage.removeItem(tokenExpiresAtKey)
}

export function isAccessTokenExpired(user: AuthUser, skewMilliseconds = 30000) {
  return user.expiresAt <= Date.now() + skewMilliseconds
}

export function isRefreshTokenExpired(user: AuthUser, skewMilliseconds = 30000) {
  return typeof user.refreshTokenExpiresAt === 'number' && user.refreshTokenExpiresAt <= Date.now() + skewMilliseconds
}
