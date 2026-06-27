import { FormEvent, useMemo, useState } from 'react'
import LockResetOutlinedIcon from '@mui/icons-material/LockResetOutlined'
import { Alert, Avatar, Box, Button, Container, Paper, Stack, TextField, Typography } from '@mui/material'
import { Link as RouterLink, Navigate, useSearchParams } from 'react-router'
import { useAppSelector } from '../../app/hooks'
import { authApi } from '../../shared/api'
import { getDefaultAuthenticatedPath } from '../../shared/auth/authRedirects'
import { AuthShowcase } from '../common/AuthShowcase'

export function ResetPasswordPage() {
  const { user } = useAppSelector((state) => state.auth)
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
      setFormError('Şifre sıfırlama bağlantısı eksik veya geçersiz.')
      return
    }

    if (newPassword !== confirmPassword) {
      setFormError('Şifreler aynı olmalı.')
      return
    }

    setIsSubmitting(true)

    try {
      await authApi.resetPassword({ email, newPassword, token })
      setIsComplete(true)
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Container maxWidth="xl" sx={{ py: { md: 8, xs: 5 } }}>
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
                Şifreyi Yenile
              </Typography>
              <Typography color="text.secondary" sx={{ textAlign: 'center' }}>
                Hesabınız için yeni ve güçlü bir şifre seçin.
              </Typography>
            </Stack>

            {isTokenMissing && <Alert severity="warning">Şifre sıfırlama bağlantısı eksik veya geçersiz.</Alert>}
            {formError && <Alert severity="error">{formError}</Alert>}
            {isComplete && (
              <Alert
                action={
                  <Button color="inherit" component={RouterLink} size="small" to="/login">
                    Giriş yap
                  </Button>
                }
                severity="success"
              >
                Şifren yenilendi. Yeni şifrenle giriş yapabilirsin.
              </Alert>
            )}

            <TextField
              autoComplete="email"
              fullWidth
              label="E-posta"
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <TextField
              autoComplete="new-password"
              fullWidth
              helperText="En az 6 karakter, büyük harf, küçük harf ve rakam içermeli."
              label="Yeni şifre"
              required
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
            <TextField
              autoComplete="new-password"
              fullWidth
              label="Yeni şifre tekrar"
              required
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
            <Button disabled={isSubmitting || isTokenMissing || isComplete} size="large" type="submit" variant="contained">
              {isSubmitting ? 'Yenileniyor' : 'Şifreyi yenile'}
            </Button>
            <Button component={RouterLink} to="/login" variant="text">
              Giriş sayfasına dön
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Container>
  )
}
