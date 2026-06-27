import { useEffect } from 'react'
import { Navigate, Outlet, useLocation, useNavigate, useOutletContext } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Box, CircularProgress } from '@mui/material'
import type { AppOutletContext } from '../App'
import { selectCurrentUser } from './authSlice'
import { useAppSelector } from './hooks'
import { onboardingApi } from '../shared/api'

const STATUS_KEY = ['onboarding', 'status'] as const

const BYPASS_PATHS = ['/onboarding', '/profile', '/dashboard/access-requests']

export function StudentOnboardingGuard() {
  const user = useAppSelector(selectCurrentUser)
  const location = useLocation()
  const navigate = useNavigate()
  const appContext = useOutletContext<AppOutletContext>()

  const enabled = user?.role === 'Student'

  const { data, isLoading, isError } = useQuery({
    queryKey: STATUS_KEY,
    queryFn: onboardingApi.getStatus,
    enabled,
    retry: 2,
    staleTime: 60_000,
  })

  useEffect(() => {
    if (!enabled || isLoading || isError || !data) {
      return
    }

    const isBypassed = BYPASS_PATHS.some((path) => location.pathname.startsWith(path))

    if (data.showOnboarding && !isBypassed) {
      navigate('/onboarding', { replace: true, state: { from: location.pathname } })
    }
  }, [data, enabled, isError, isLoading, location.pathname, navigate])

  if (enabled && isLoading) {
    return (
      <Box sx={{ alignItems: 'center', display: 'flex', justifyContent: 'center', minHeight: 240 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (user?.role === 'Admin') {
    return <Navigate replace to="/admin" />
  }

  return <Outlet context={appContext} />
}
