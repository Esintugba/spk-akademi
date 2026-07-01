import { FormEvent, useState } from 'react'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import { Alert, Avatar, Box, Button, Container, Paper, Stack, TextField, Typography } from '@mui/material'
import { Link as RouterLink, Navigate } from 'react-router'
import { useAppSelector } from '../../app/hooks'
import { authApi } from '../../shared/api'
import { getDefaultAuthenticatedPath } from '../../shared/auth/authRedirects'
import { useLocalization } from '../../shared/localization'
import { AuthShowcase } from '../common/AuthShowcase'
import { LanguageSwitch } from '../common/LanguageSwitch'

const successMessage = 'E-posta adresi sistemde kayıtlıysa şifre sıfırlama bağlantısı gönderildi.'

export function ForgotPasswordPage() {
  const { user } = useAppSelector((state) => state.auth)
  const { t } = useLocalization()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  if (user) {
    return <Navigate replace to={getDefaultAuthenticatedPath(user.role)} />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setIsSubmitting(true)

    try {
      await authApi.forgotPassword({ email })
      setMessage(successMessage)
    } catch {
      // Hata mesajı axios interceptor üzerinden gösteriliyor.
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Container maxWidth="xl" sx={{ py: { md: 8, xs: 5 } }}>
      <Stack direction="row" sx={{ justifyContent: 'flex-end', mb: 2 }}>
        <LanguageSwitch />
      </Stack>
      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { lg: '1fr 0.9fr', xs: '1fr' } }}>
        <AuthShowcase
          title="Hesabına yeniden erişim al."
          description="Kayıtlı e-posta adresine tek kullanımlık şifre yenileme bağlantısı gönderilir."
        />

        <Paper component="form" onSubmit={handleSubmit} sx={{ borderRadius: 5, p: { md: 4, xs: 3 } }} variant="outlined">
          <Stack spacing={2.5}>
            <Stack spacing={1} sx={{ alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <EmailOutlinedIcon />
              </Avatar>
              <Typography component="h1" sx={{ fontSize: 30, fontWeight: 900 }}>
                {t('Şifremi Unuttum')}
              </Typography>
              <Typography color="text.secondary" sx={{ textAlign: 'center' }}>
                {t('Hesabına bağlı e-posta adresini yaz.')}
              </Typography>
            </Stack>

            {message && <Alert severity="success">{t(message)}</Alert>}

            <TextField
              autoComplete="email"
              autoFocus
              fullWidth
              label={t('E-posta')}
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Button disabled={isSubmitting} size="large" type="submit" variant="contained">
              {isSubmitting ? t('Gönderiliyor') : t('Bağlantı gönder')}
            </Button>
            <Button component={RouterLink} to="/login" variant="text">
              {t('Giriş sayfasına dön')}
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Container>
  )
}
