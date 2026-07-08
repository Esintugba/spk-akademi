import axios, { AxiosError, type AxiosRequestConfig } from 'axios'
import { toast } from 'react-toastify'
import type { AuthUser, LoginResponse } from '../../models'
import { clearStoredUser, getStoredUser, isAccessTokenExpired, updateStoredTokens } from '../auth/authStorage'

interface ApiErrorResponse {
  details?: string
  message?: string
  statusCode?: number
  title?: string
}

interface SpkAxiosRequestConfig extends AxiosRequestConfig {
  skipAuth?: boolean
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message)
    this.name = 'ApiRequestError'
  }
}

export class AuthRefreshError extends Error {
  constructor(
    message: string,
    public readonly invalidSession: boolean,
    public readonly status?: number,
  ) {
    super(message)
    this.name = 'AuthRefreshError'
  }
}

const baseURL = import.meta.env.VITE_API_BASE_URL ?? ''

const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

let refreshPromise: Promise<AuthUser | null> | null = null

function notifyInvalidAuth() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('spk:auth-invalid'))
  }
}

function notifyAuthRefreshed(user: AuthUser) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<AuthUser>('spk:auth-refreshed', { detail: user }))
  }
}

function isInvalidRefreshError(error: unknown) {
  return axios.isAxiosError(error) && (error.response?.status === 400 || error.response?.status === 401)
}

export function isAuthRefreshError(error: unknown): error is AuthRefreshError {
  return error instanceof AuthRefreshError
}

export async function refreshStoredSession() {
  const user = getStoredUser()

  if (!user?.refreshToken) {
    return null
  }

  if (!refreshPromise) {
    refreshPromise = axios
      .post<LoginResponse>(
        `${baseURL}/api/account/refresh`,
        { refreshToken: user.refreshToken },
        { headers: { 'Content-Type': 'application/json' } },
      )
      .then((response) => {
        const updatedUser = updateStoredTokens(response.data)

        if (updatedUser) {
          notifyAuthRefreshed(updatedUser)
        }

        return updatedUser
      })
      .catch((error) => {
        const status = axios.isAxiosError(error) ? error.response?.status : undefined

        if (isInvalidRefreshError(error)) {
          clearStoredUser()
          notifyInvalidAuth()
          throw new AuthRefreshError('Oturum yenileme anahtarı geçersiz.', true, status)
        }

        throw new AuthRefreshError('Oturum şu anda yenilenemedi.', false, status)
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

axiosInstance.interceptors.request.use(async (config) => {
  if (config.url?.includes('/api/account/refresh')) {
    return config
  }

  if ((config as SpkAxiosRequestConfig).skipAuth) {
    return config
  }

  let user = getStoredUser()

  if (user && isAccessTokenExpired(user)) {
    try {
      user = await refreshStoredSession()
    } catch (error) {
      if (isAuthRefreshError(error) && error.invalidSession) {
        return Promise.reject(new ApiRequestError('Oturum süresi doldu.', 401))
      }

      return Promise.reject(error)
    }

    if (!user) {
      return Promise.reject(new ApiRequestError('Oturum süresi doldu.', 401))
    }
  }

  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`
  }

  return config
})

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined
    const isRefreshRequest = Boolean(originalRequest?.url?.includes('/api/account/refresh'))

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isRefreshRequest) {
      originalRequest._retry = true

      try {
        const user = await refreshStoredSession()

        if (user?.token) {
          originalRequest.headers = {
            ...originalRequest.headers,
            Authorization: `Bearer ${user.token}`,
          }

          return await axiosInstance.request(originalRequest)
        }
      } catch (refreshError) {
        if (isAuthRefreshError(refreshError) && !refreshError.invalidSession) {
          toast.error('Oturum şu anda yenilenemedi. Bağlantını kontrol edip tekrar dene.', { toastId: 'api-auth-refresh-failed' })
          return Promise.reject(new ApiRequestError(refreshError.message, refreshError.status))
        }

        clearStoredUser()
        notifyInvalidAuth()
      }
    }

    const responseData = error.response?.data
    const status = error.response?.status
    const message = responseData?.message || responseData?.title || error.message || 'İstek başarısız oldu.'

    if (status === 400) {
      toast.error(message || 'Geçersiz istek.')
    } else if (status === 401 && !isRefreshRequest) {
      clearStoredUser()
      notifyInvalidAuth()
      toast.error('Bu işlem için giriş yapman gerekiyor.', { toastId: 'api-auth-required' })
    } else if (status === 403) {
      toast.error('Bu işlem için yetkin yok.', { toastId: 'api-forbidden' })
    } else if (status === 404) {
      toast.error('İstenen kaynak bulunamadı.')
    } else if (status && status >= 500) {
      toast.error(message || 'Sunucuda beklenmeyen bir hata oluştu.')
    } else if (!isRefreshRequest) {
      toast.error(message)
    }

    return Promise.reject(new ApiRequestError(message, status))
  },
)

export const request = {
  get: async <T>(url: string, config?: SpkAxiosRequestConfig) => {
    const response = await axiosInstance.get<T>(url, config)
    return response.data
  },
  post: async <T>(url: string, data?: unknown, config?: SpkAxiosRequestConfig) => {
    const response = await axiosInstance.post<T>(url, data, config)
    return response.data
  },
  put: async <T>(url: string, data?: unknown, config?: SpkAxiosRequestConfig) => {
    const response = await axiosInstance.put<T>(url, data, config)
    return response.data
  },
  patch: async <T>(url: string, data?: unknown, config?: SpkAxiosRequestConfig) => {
    const response = await axiosInstance.patch<T>(url, data, config)
    return response.data
  },
  delete: async <T>(url: string, config?: SpkAxiosRequestConfig) => {
    const response = await axiosInstance.delete<T>(url, config)
    return response.data
  },
}
