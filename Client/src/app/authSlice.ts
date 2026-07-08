import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import type { AuthUser, LoginRequest, RegisterRequest } from '../models'
import { api } from '../shared/api'
import { isAuthRefreshError, refreshStoredSession } from '../shared/api/client'
import {
  clearStoredUser,
  createAuthUser,
  getStoredUser,
  isAccessTokenExpired,
  isRefreshTokenExpired,
  saveStoredUser,
} from '../shared/auth/authStorage'
import type { RootState } from './store'

interface AuthState {
  error: string
  hasInitialized: boolean
  initializationError: string
  isAuthenticated: boolean
  isInitializing: boolean
  isLoading: boolean
  isRefreshing: boolean
  user: AuthUser | null
}

const storedUser = getStoredUser()
const storedUserHasValidAccessToken = storedUser && !isAccessTokenExpired(storedUser)

const initialState: AuthState = {
  error: '',
  hasInitialized: false,
  initializationError: '',
  isAuthenticated: Boolean(storedUserHasValidAccessToken),
  isInitializing: true,
  isLoading: false,
  isRefreshing: false,
  user: storedUser ?? null,
}

export const initializeAuth = createAsyncThunk<AuthUser | null, void, { rejectValue: { invalidSession: boolean } }>(
  'auth/initializeAuth',
  async (_, { rejectWithValue }) => {
    const user = getStoredUser()

    if (user && !isAccessTokenExpired(user)) {
      return user
    }

    if (user && isRefreshTokenExpired(user)) {
      clearStoredUser()
      return null
    }

    try {
      return await refreshStoredSession()
    } catch (error) {
      return rejectWithValue({ invalidSession: isAuthRefreshError(error) && error.invalidSession })
    }
  },
)

export const loginUser = createAsyncThunk('auth/loginUser', async (payload: LoginRequest) => {
  const response = await api.login(payload)
  const user = createAuthUser(response)
  saveStoredUser(user)

  return user
})

export const registerUser = createAsyncThunk('auth/registerUser', async (payload: RegisterRequest) => {
  await api.register(payload)
  const response = await api.login(payload)
  const user = createAuthUser(response)
  saveStoredUser(user)

  return user
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      clearStoredUser()
      state.error = ''
      state.hasInitialized = true
      state.initializationError = ''
      state.isAuthenticated = false
      state.isInitializing = false
      state.isLoading = false
      state.isRefreshing = false
      state.user = null
    },
    sessionRefreshed(state, action: { payload: AuthUser }) {
      state.error = ''
      state.hasInitialized = true
      state.initializationError = ''
      state.isAuthenticated = true
      state.isInitializing = false
      state.isRefreshing = false
      state.user = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.error = ''
        state.initializationError = ''
        state.isInitializing = true
        state.isRefreshing = Boolean(state.user)
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.error = ''
        state.hasInitialized = true
        state.initializationError = ''
        state.isAuthenticated = Boolean(action.payload)
        state.isInitializing = false
        state.isRefreshing = false
        state.user = action.payload
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        const invalidSession = action.payload?.invalidSession ?? false
        state.error = 'Oturum yenilenemedi.'
        state.hasInitialized = invalidSession
        state.initializationError = invalidSession ? '' : 'Oturum yenilenemedi.'
        state.isAuthenticated = false
        state.isInitializing = false
        state.isRefreshing = false
        state.user = invalidSession ? null : state.user
      })
      .addCase(loginUser.pending, (state) => {
        state.error = ''
        state.initializationError = ''
        state.isLoading = true
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.hasInitialized = true
        state.initializationError = ''
        state.isAuthenticated = true
        state.isInitializing = false
        state.isRefreshing = false
        state.user = action.payload
        state.isLoading = false
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.error = action.error.message || 'Giris yapilamadi.'
        state.hasInitialized = true
        state.initializationError = ''
        state.isAuthenticated = false
        state.isInitializing = false
        state.isRefreshing = false
        state.isLoading = false
        state.user = null
      })
      .addCase(registerUser.pending, (state) => {
        state.error = ''
        state.initializationError = ''
        state.isLoading = true
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.hasInitialized = true
        state.initializationError = ''
        state.isAuthenticated = true
        state.isInitializing = false
        state.isRefreshing = false
        state.user = action.payload
        state.isLoading = false
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.error = action.error.message || 'Kayit olusturulamadi.'
        state.hasInitialized = true
        state.initializationError = ''
        state.isAuthenticated = false
        state.isInitializing = false
        state.isRefreshing = false
        state.isLoading = false
        state.user = null
      })
  },
})

export const { logout, sessionRefreshed } = authSlice.actions

export const selectCurrentUser = (state: RootState) => state.auth.user
export const selectAuthInitializationError = (state: RootState) => state.auth.initializationError
export const selectHasInitializedAuth = (state: RootState) => state.auth.hasInitialized
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated
export const selectIsAdmin = (state: RootState) => state.auth.user?.role === 'Admin'
export const selectIsAuthInitializing = (state: RootState) => state.auth.isInitializing
export const selectIsAuthRefreshing = (state: RootState) => state.auth.isRefreshing

export default authSlice.reducer
