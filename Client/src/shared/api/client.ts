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
  skipCsrf?: boolean
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
const csrfHeaderName = 'X-XSRF-TOKEN'

const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

let csrfPromise: Promise<string> | null = null
let csrfToken: string | null = null
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

function isUnsafeMethod(method?: string) {
  return ['delete', 'patch', 'post', 'put'].includes((method ?? 'get').toLowerCase())
}

async function ensureCsrfToken() {
  if (csrfToken) {
    return csrfToken
  }

  if (!csrfPromise) {
    csrfPromise = axios
      .get<{ csrfToken: string }>(`${baseURL}/api/account/csrf`, { withCredentials: true })
      .then((response) => {
        csrfToken = response.data.csrfToken
        return csrfToken
      })
      .finally(() => {
        csrfPromise = null
      })
  }

  return csrfPromise
}

export function isAuthRefreshError(error: unknown): error is AuthRefreshError {
  return error instanceof AuthRefreshError
}

export async function refreshStoredSession() {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<LoginResponse>(
        `${baseURL}/api/account/refresh`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            [csrfHeaderName]: await ensureCsrfToken(),
          },
          withCredentials: true,
        },
      )
      .then((response) => {
        const updatedUser = updateStoredTokens(response.data)
        notifyAuthRefreshed(updatedUser)

        return updatedUser
      })
      .catch((error) => {
        const status = axios.isAxiosError(error) ? error.response?.status : undefined

        if (isInvalidRefreshError(error)) {
          csrfToken = null
          clearStoredUser()
          notifyInvalidAuth()
          throw new AuthRefreshError('Oturum yenileme anahtari gecersiz.', true, status)
        }

        throw new AuthRefreshError('Oturum su anda yenilenemedi.', false, status)
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

axiosInstance.interceptors.request.use(async (config) => {
  const spkConfig = config as SpkAxiosRequestConfig

  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }

  if (isUnsafeMethod(config.method) && !spkConfig.skipCsrf) {
    config.headers[csrfHeaderName] = await ensureCsrfToken()
  }

  if (spkConfig.skipAuth) {
    return config
  }

  let user = getStoredUser()
  const isRefreshRequest = Boolean(config.url?.includes('/api/account/refresh'))

  if (!isRefreshRequest && (!user || isAccessTokenExpired(user))) {
    try {
      user = await refreshStoredSession()
    } catch (error) {
      if (isAuthRefreshError(error) && error.invalidSession) {
        return Promise.reject(new ApiRequestError('Oturum suresi doldu.', 401))
      }

      return Promise.reject(error)
    }

    if (!user) {
      return Promise.reject(new ApiRequestError('Oturum suresi doldu.', 401))
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
          toast.error('Oturum su anda yenilenemedi. Baglantini kontrol edip tekrar dene.', { toastId: 'api-auth-refresh-failed' })
          return Promise.reject(new ApiRequestError(refreshError.message, refreshError.status))
        }

        csrfToken = null
        clearStoredUser()
        notifyInvalidAuth()
      }
    }

    const responseData = error.response?.data
    const status = error.response?.status
    const message = responseData?.message || responseData?.title || error.message || 'Istek basarisiz oldu.'

    if (status === 400) {
      toast.error(message || 'Gecersiz istek.')
    } else if (status === 401 && !isRefreshRequest) {
      csrfToken = null
      clearStoredUser()
      notifyInvalidAuth()
      toast.error('Bu islem icin giris yapman gerekiyor.', { toastId: 'api-auth-required' })
    } else if (status === 403) {
      toast.error('Bu islem icin yetkin yok.', { toastId: 'api-forbidden' })
    } else if (status === 404) {
      toast.error('Istenen kaynak bulunamadi.')
    } else if (status && status >= 500) {
      toast.error(message || 'Sunucuda beklenmeyen bir hata olustu.')
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
