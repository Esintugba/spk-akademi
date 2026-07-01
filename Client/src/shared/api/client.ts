import axios, { AxiosError, type AxiosRequestConfig } from 'axios'
import { toast } from 'react-toastify'
import type { LoginResponse } from '../../models'
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

const baseURL = import.meta.env.VITE_API_BASE_URL ?? ''

const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

let refreshPromise: Promise<ReturnType<typeof updateStoredTokens>> | null = null

function notifyInvalidAuth() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('spk:auth-invalid'))
  }
}

async function refreshAccessToken() {
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
      .then((response) => updateStoredTokens(response.data))
      .catch((error) => {
        clearStoredUser()
        notifyInvalidAuth()
        throw error
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
      user = await refreshAccessToken()
    } catch {
      clearStoredUser()
      notifyInvalidAuth()
      user = null
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
        const user = await refreshAccessToken()

        if (user?.token) {
          originalRequest.headers = {
            ...originalRequest.headers,
            Authorization: `Bearer ${user.token}`,
          }

          return await axiosInstance.request(originalRequest)
        }
      } catch {
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
