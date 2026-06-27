import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Alert, Button, Stack } from '@mui/material'
import { Link as RouterLink } from 'react-router'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

export class QuizResultErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('QuizResultErrorBoundary', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <Stack spacing={2} sx={{ py: 4 }}>
          <Alert severity="error">Sonuç ekranı yüklenirken bir hata oluştu: {this.state.message}</Alert>
          <Button component={RouterLink} to="/quiz" variant="contained">
            Soru bankasına dön
          </Button>
        </Stack>
      )
    }

    return this.props.children
  }
}
