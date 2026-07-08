import { useEffect } from 'react'
import { Outlet } from 'react-router'
import type { AuthUser } from './models'
import { initializeAuth, logout, sessionRefreshed } from './app/authSlice'
import { useAppDispatch } from './app/hooks'
import './App.css'

export type AppOutletContext = Record<string, never>

function App() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    void dispatch(initializeAuth())
  }, [dispatch])

  useEffect(() => {
    function handleInvalidAuth() {
      dispatch(logout())
    }

    function handleAuthRefreshed(event: Event) {
      const user = (event as CustomEvent<AuthUser>).detail

      if (user) {
        dispatch(sessionRefreshed(user))
      }
    }

    window.addEventListener('spk:auth-invalid', handleInvalidAuth)
    window.addEventListener('spk:auth-refreshed', handleAuthRefreshed)

    return () => {
      window.removeEventListener('spk:auth-invalid', handleInvalidAuth)
      window.removeEventListener('spk:auth-refreshed', handleAuthRefreshed)
    }
  }, [dispatch])

  return (
    <Outlet context={{}} />
  )
}

export default App
