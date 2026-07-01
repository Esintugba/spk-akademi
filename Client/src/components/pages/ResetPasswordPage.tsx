import { FormEvent, useMemo, useState } from 'react'
import LockResetOutlinedIcon from '@mui/icons-material/LockResetOutlined'
import { Alert, Avatar, Box, Button, Container, Paper, Stack, TextField, Typography } from '@mui/material'
import { Link as RouterLink, Navigate, useSearchParams } from 'react-router'
import { useAppSelector } from '../../app/hooks'
import { authApi } from '../../shared/api'
import { getDefaultAuthenticatedPath } from '../../shared/auth/authRedirects'
import { useLocalization } from '../../shared/localization'
import { AuthShowcase } from '../common/AuthShowcase'
import { LanguageSwitch } from '../common/LanguageSwitch'

export function ResetPasswordPage() {
  const { user } = useAppSelector((state) => state.auth)
  const { t } = useLocalization()
  const [searchParams] = useSearchParams()
  const token = useMemo(() => searchParams.get('token') ?? '', [searchParams])
  const initialEmail = useMemo(() => searchParams.get('email') ?? '', [searchParams])
  const [email, setEmail] = useState(initialEmail)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  if (user) {
    return <Navigate replace to={getDefaultAuthenticatedPath(user.role)} />
  }

  const isTokenMissing = token.trim().length === 0

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')

    if (isTokenMissing) {
      setFormError(t('Şifre sıfırlama bağlantısı eksik veya geçersiz.'))
      return
    }

    if (newPassword !== confirmPassword) {
      setFormError(t('Şifreler aynı olmalı.'))
      return
    }

    setIsSubmitting(true)
    
    try {
      await authApi.resetPassword({ email, newPassword, token })
      setIsComplete(true)
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      console.error(error)
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
          title="Yeni şifreni belirle."
          description="E-postadaki bağlantıyı doğruladıktan sonra hesabın yeni şifresiyle açılabilir."
        />

        <Paper component="form" onSubmit={handleSubmit} sx={{ borderRadius: 5, p: { md: 4, xs: 3 } }} variant="outlined">
          <Stack spacing={2.5}>
            <Stack spacing={1} sx={{ alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <LockResetOutlinedIcon />
              </Avatar>
              <Typography component="h1" sx={{ fontSize: 30, fontWeight: 900 }}>
                {t('Şifreyi Yenile')}
              </Typography>
              <Typography color="text.secondary" sx={{ textAlign: 'center' }}>
                {t('Hesabınız için yeni ve güçlü bir şifre seçin.')}
              </Typography>
            </Stack>

            {isTokenMissing && <Alert severity="warning">{t('Şifre sıfırlama bağlantısı eksik veya geçersiz.')}</Alert>}
            {formError && <Alert severity="error">{formError}</Alert>}
            {isComplete && (
              <Alert
                action={
                  <Button color="inherit" component={RouterLink} size="small" to="/login">
                    {t('Giriş yap')}
                  </Button>
                }
                severity="success"
              >
                {t('Şifren yenilendi. Yeni şifrenle giriş yapabilirsin.')}
              </Alert>
            )}

            <TextField
              autoComplete="email"
              fullWidth
              label={t('E-posta')}
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <TextField
              autoComplete="new-password"
              fullWidth
              helperText={t('En az 6 karakter, büyük harf, küçük harf ve rakam içermeli.')}
              label={t('Yeni şifre')}
              required
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
            <TextField
              autoComplete="new-password"
              fullWidth
              label={t('Yeni şifre tekrar')}
              required
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
            <Button disabled={isSubmitting || isTokenMissing || isComplete} size="large" type="submit" variant="contained">
              {isSubmitting ? t('Yenileniyor') : t('Şifreyi yenile')}
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
