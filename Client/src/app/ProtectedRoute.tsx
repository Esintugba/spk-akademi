import { Navigate, Outlet, useLocation, useOutletContext } from 'react-router'
import { Alert, Box, Button, CircularProgress } from '@mui/material'
import type { AppOutletContext } from '../App'
import { initializeAuth, selectAuthInitializationError, selectIsAuthenticated, selectIsAuthInitializing } from './authSlice'
import { useAppDispatch, useAppSelector } from './hooks'

export function ProtectedRoute() {
  const dispatch = useAppDispatch()
  const initializationError = useAppSelector(selectAuthInitializationError)
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const isInitializing = useAppSelector(selectIsAuthInitializing)
  const location = useLocation()
  const appContext = useOutletContext<AppOutletContext>()

  if (isInitializing) {
    return (
      <Box sx={{ alignItems: 'center', display: 'flex', justifyContent: 'center', minHeight: 240 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (initializationError) {
    return (
      <Box sx={{ alignItems: 'center', display: 'flex', justifyContent: 'center', minHeight: 240, px: 2 }}>
        <Alert
          action={(
            <Button color="inherit" onClick={() => void dispatch(initializeAuth())} size="small">
              Tekrar dene
            </Button>
          )}
          severity="warning"
        >
          Oturum yenilenemedi. Baglantini kontrol edip tekrar deneyebilirsin.
        </Alert>
      </Box>
    )
  }

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to="/login" />
  }

  return <Outlet context={appContext} />
}
