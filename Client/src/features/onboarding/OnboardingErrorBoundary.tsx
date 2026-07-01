import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Alert, Button, Stack } from '@mui/material'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class OnboardingErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Onboarding render error', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <Stack spacing={2}>
          <Alert severity="error">Onboarding yüklenirken bir hata oluştu.</Alert>
          <Button onClick={() => this.setState({ hasError: false })} variant="outlined">
            Tekrar dene
          </Button>
        </Stack>
      )
    }

    return this.props.children
  }
}
