import { Navigate, Outlet, useOutletContext } from 'react-router'
import type { AppOutletContext } from '../App'
import { selectIsAdmin } from './authSlice'
import { useAppSelector } from './hooks'

export function AdminRoute() {
  const isAdmin = useAppSelector(selectIsAdmin)
  const appContext = useOutletContext<AppOutletContext>()

  if (!isAdmin) {
    return <Navigate replace to="/dashboard" />
  }

  return <Outlet context={appContext} />
}
