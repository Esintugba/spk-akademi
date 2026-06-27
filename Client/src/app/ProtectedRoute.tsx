import { Navigate, Outlet, useLocation, useOutletContext } from 'react-router'
import type { AppOutletContext } from '../App'
import { selectIsAuthenticated } from './authSlice'
import { useAppSelector } from './hooks'

export function ProtectedRoute() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const location = useLocation()
  const appContext = useOutletContext<AppOutletContext>()

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to="/login" />
  }

  return <Outlet context={appContext} />
}
