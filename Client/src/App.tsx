import { useEffect } from 'react'
import { Outlet } from 'react-router'
import { logout } from './app/authSlice'
import { useAppDispatch } from './app/hooks'
import './App.css'

export type AppOutletContext = Record<string, never>

function App() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    function handleInvalidAuth() {
      dispatch(logout())
    }

    window.addEventListener('spk:auth-invalid', handleInvalidAuth)
    return () => window.removeEventListener('spk:auth-invalid', handleInvalidAuth)
  }, [dispatch])

  return (
    <Outlet context={{}} />
  )
}

export default App
