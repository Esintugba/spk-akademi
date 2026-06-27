import type { Location } from 'react-router'
import type { AuthUser } from '../../models'

type UserRole = AuthUser['role']

function defaultPathForRole(role: UserRole) {
  return role === 'Admin' ? '/admin' : '/dashboard'
}

function isSafeInternalPath(pathname: string) {
  return pathname.startsWith('/') && !pathname.startsWith('//') && pathname !== '/login' && pathname !== '/register'
}

function isAdminPath(pathname: string) {
  return pathname === '/admin' || pathname.startsWith('/admin/')
}

function extractPathname(from: unknown): string | undefined {
  if (typeof from === 'string') {
    return from
  }

  if (from && typeof from === 'object' && 'pathname' in from) {
    const pathname = (from as Pick<Location, 'pathname'>).pathname
    return typeof pathname === 'string' ? pathname : undefined
  }

  return undefined
}

export function resolvePostAuthRedirect(role: UserRole, from: unknown) {
  const fallbackPath = defaultPathForRole(role)
  const fromPath = extractPathname(from)

  if (!fromPath || !isSafeInternalPath(fromPath)) {
    return fallbackPath
  }

  if (role === 'Admin') {
    return isAdminPath(fromPath) ? fromPath : fallbackPath
  }

  return isAdminPath(fromPath) ? fallbackPath : fromPath
}

export function getDefaultAuthenticatedPath(role: UserRole) {
  return defaultPathForRole(role)
}
