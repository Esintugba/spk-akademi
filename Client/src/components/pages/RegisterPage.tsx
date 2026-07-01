import { FormEvent, useState } from 'react'
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined'
import { Alert, Avatar, Box, Button, Checkbox, Container, FormControlLabel, Link, Paper, Stack, TextField, Typography } from '@mui/material'
import { Link as RouterLink, Navigate, useNavigate } from 'react-router'
import { registerUser } from '../../app/authSlice'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { getDefaultAuthenticatedPath } from '../../shared/auth/authRedirects'
import { AuthShowcase } from '../common/AuthShowcase'

export function RegisterPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { error, isLoading, user } = useAppSelector((state) => state.auth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [kvkkAccepted, setKvkkAccepted] = useState(false)
  const [commercialElectronicMessages, setCommercialElectronicMessages] = useState(false)
  const [formError, setFormError] = useState('')

  if (user) {
    return <Navigate replace to={getDefaultAuthenticatedPath(user.role)} />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')

    if (password !== confirmPassword) {
      setFormError('Şifreler aynı olmalı.')
      return
    }

    if (!kvkkAccepted) {
      setFormError('KVKK Aydınlatma Metnini okuduğunu onaylamalısın.')
      return
    }

    try {
      const registeredUser = await dispatch(registerUser({
        email,
        password,
        kvkkAccepted,
        commercialElectronicMessages,
        consentVersion: 'v1',
      })).unwrap()
      navigate(registeredUser.role === 'Admin' ? '/admin' : '/onboarding')
    } catch {
      // Hata mesajı authSlice ve axios interceptor üzerinden gösteriliyor.
    }
  }

  return (
    <Container maxWidth="xl" sx={{ py: { md: 8, xs: 5 } }}>
      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { lg: '1fr 0.9fr', xs: '1fr' } }}>
        <AuthShowcase
          title="Kişisel Çalışma alanını birkaç adımda oluştur."
          description="Kayıt olduktan sonra erişimlerin, ücretsiz deneme akışların ve öğrenci panelin tek hesapta toplanır."
        />

        <Paper component="form" onSubmit={handleSubmit} sx={{ borderRadius: 5, p: { md: 4, xs: 3 } }} variant="outlined">
          <Stack spacing={2.5}>
            <Stack spacing={1} sx={{ alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <PersonAddAltOutlinedIcon />
              </Avatar>
              <Typography component="h1" sx={{ fontSize: 30, fontWeight: 900 }}>
                Kayıt Ol
              </Typography>
              <Typography color="text.secondary" sx={{ textAlign: 'center' }}>
                Kişisel SPK çalışma alanın için yeni hesap oluştur.
              </Typography>
            </Stack>

            {(formError || error) && <Alert severity="error">{formError || error}</Alert>}

            <TextField autoComplete="email" autoFocus fullWidth label="E-posta" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            <TextField autoComplete="new-password" fullWidth helperText="En az 6 karakter, büyük harf, küçük harf ve rakam içermeli." label="Şifre" required type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            <TextField autoComplete="new-password" fullWidth label="Şifre tekrar" required type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
            <FormControlLabel
              control={<Checkbox checked={kvkkAccepted} onChange={(event) => setKvkkAccepted(event.target.checked)} />}
              label={<Typography variant="body2"><Link component={RouterLink} to="/kvkk">KVKK Aydınlatma Metnini</Link> okudum.</Typography>}
            />
            <FormControlLabel
              control={<Checkbox checked={commercialElectronicMessages} onChange={(event) => setCommercialElectronicMessages(event.target.checked)} />}
              label="Ticari elektronik ileti almak istiyorum."
            />
            <Button disabled={isLoading} size="large" type="submit" variant="contained">
              {isLoading ? 'Kayıt oluşturuluyor' : 'Kayıt ol'}
            </Button>
            <Button component={RouterLink} disabled={isLoading} to="/login" variant="text">
              Zaten hesabım var
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Container>
  )
}
