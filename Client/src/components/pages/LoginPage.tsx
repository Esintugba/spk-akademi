import { FormEvent, useState } from 'react'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import { Alert, Avatar, Box, Button, Container, Paper, Stack, TextField, Typography } from '@mui/material'
import { Link as RouterLink, Navigate, useLocation, useNavigate } from 'react-router'
import { loginUser } from '../../app/authSlice'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { getDefaultAuthenticatedPath, resolvePostAuthRedirect } from '../../shared/auth/authRedirects'
import { AuthShowcase } from '../common/AuthShowcase'
import { LanguageSwitch } from '../common/LanguageSwitch'
import { useLocalization } from '../../shared/localization'

export function LoginPage() {
  const dispatch = useAppDispatch()
  const location = useLocation()
  const navigate = useNavigate()
  const { error, isLoading, user } = useAppSelector((state) => state.auth)
  const { t } = useLocalization()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  if (user) {
    return <Navigate replace to={getDefaultAuthenticatedPath(user.role)} />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      const loggedInUser = await dispatch(loginUser({ email, password })).unwrap()
      navigate(resolvePostAuthRedirect(loggedInUser.role, location.state?.from), { replace: true })
    } catch {
      // Hata mesajı authSlice ve axios interceptor üzerinden gösteriliyor.
    }
  }

  return (
    <Container maxWidth="xl" sx={{ py: { md: 8, xs: 5 } }}>
      <Stack direction="row" sx={{ justifyContent: 'flex-end', mb: 2 }}>
        <LanguageSwitch />
      </Stack>
      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { lg: '1fr 0.9fr', xs: '1fr' } }}>
        <AuthShowcase
          title="Çalışma paneline güvenle geri dön."
          description="Kaldığın konu, aktif denemen ve lisans erişimlerin seni girişten sonra bekliyor."
        />

        <Paper component="form" onSubmit={handleSubmit} sx={{ borderRadius: 5, p: { md: 4, xs: 3 } }} variant="outlined">
          <Stack spacing={2.5}>
            <Stack spacing={1} sx={{ alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <LockOutlinedIcon />
              </Avatar>
              <Typography component="h1" sx={{ fontSize: 30, fontWeight: 900 }}>
                {t('Giriş Yap')}
              </Typography>
              <Typography color="text.secondary" sx={{ textAlign: 'center' }}>
                {t('SPK çalışma paneline devam etmek için hesabınla giriş yap.')}
              </Typography>
            </Stack>

            {error && <Alert severity="error">{error}</Alert>}

            <TextField autoComplete="email" autoFocus fullWidth label={t('E-posta')} required type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            <TextField autoComplete="current-password" fullWidth label={t('Şifre')} required type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            <Button disabled={isLoading} size="large" type="submit" variant="contained">
              {isLoading ? t('Giriş yapılıyor') : t('Giriş yap')}
            </Button>
            <Button component={RouterLink} to="/forgot-password" variant="text">
              {t('Şifremi Unuttum')}
            </Button>
            <Button component={RouterLink} to="/register" variant="text">
              {t('Hesabın yok mu? Kayıt ol')}
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Container>
  )
}
