import { Button } from '@mui/material'
import { Link as RouterLink } from 'react-router'
import { ErrorStatePage } from './ErrorStatePage'

interface AccessDeniedProps {
  title?: string
  message?: string
}

export function AccessDenied({
  title = 'Bu içerik için erişim gerekli.',
  message = 'Bu alana erişmek için ilgili lisans veya paket kapsamının hesabınızda tanımlı olması gerekiyor.',
}: AccessDeniedProps) {
  return (
    <ErrorStatePage
      code="403"
      description={message}
      eyebrow="Erişim gerekli"
      primaryAction={
        <Button component={RouterLink} to="/plans" variant="contained">
          Paketleri incele
        </Button>
      }
      secondaryAction={
        <Button component={RouterLink} to="/dashboard" variant="outlined">
          Panele dön
        </Button>
      }
      title={title}
      variant="forbidden"
    />
  )
}
