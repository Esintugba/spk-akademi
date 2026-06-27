import { Alert } from '@mui/material'

interface ErrorBannerProps {
  message: string
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <Alert severity="error" sx={{ mb: 2 }}>
      {message}
    </Alert>
  )
}
