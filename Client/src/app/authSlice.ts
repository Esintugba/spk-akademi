import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import type { AuthUser, LoginRequest, RegisterRequest } from '../models'
import { api } from '../shared/api'
import { clearStoredUser, createAuthUser, getStoredUser, isAccessTokenExpired, saveStoredUser } from '../shared/auth/authStorage'
import type { RootState } from './store'

interface AuthState {
  error: string
  isAuthenticated: boolean
  isLoading: boolean
  user: AuthUser | null
}

const storedUser = getStoredUser()
const initialUser = storedUser && !isAccessTokenExpired(storedUser) ? storedUser : null

if (storedUser && !initialUser) {
  clearStoredUser()
}

const initialState: AuthState = {
  error: '',
  isAuthenticated: Boolean(initialUser),
  isLoading: false,
  user: initialUser,
}

export const loginUser = createAsyncThunk('auth/loginUser', async (payload: LoginRequest) => {
  const response = await api.login(payload)
  const user = createAuthUser(payload.email, response)
  saveStoredUser(user)

  return user
})

export const registerUser = createAsyncThunk('auth/registerUser', async (payload: RegisterRequest) => {
  await api.register(payload)
  const response = await api.login(payload)
  const user = createAuthUser(payload.email, response)
  saveStoredUser(user)

  return user
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      clearStoredUser()
      state.isAuthenticated = false
      state.user = null
      state.error = ''
      state.isLoading = false
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.error = ''
        state.isLoading = true
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isAuthenticated = true
        state.user = action.payload
        state.isLoading = false
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.error = action.error.message || 'Giriş yapılamadı.'
        state.isAuthenticated = false
        state.isLoading = false
        state.user = null
      })
      .addCase(registerUser.pending, (state) => {
        state.error = ''
        state.isLoading = true
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isAuthenticated = true
        state.user = action.payload
        state.isLoading = false
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.error = action.error.message || 'Kayıt oluşturulamadı.'
        state.isAuthenticated = false
        state.isLoading = false
        state.user = null
      })
  },
})

export const { logout } = authSlice.actions

export const selectCurrentUser = (state: RootState) => state.auth.user
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated
export const selectIsAdmin = (state: RootState) => state.auth.user?.role === 'Admin'

export default authSlice.reducer
