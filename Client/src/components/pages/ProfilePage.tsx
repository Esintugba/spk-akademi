import { type FormEvent, useEffect, useState } from 'react'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined'
import { Alert, Button, Chip, Paper, Skeleton, Stack, TextField, Typography } from '@mui/material'
import { useNavigate } from 'react-router'
import { toast } from 'react-toastify'
import { logout, selectCurrentUser } from '../../app/authSlice'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import type { AccountProfile } from '../../models'
import { api } from '../../shared/api'
import { StudentPageHero } from '../common/StudentPageHero'

export function ProfilePage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const currentUser = useAppSelector(selectCurrentUser)

  const [profile, setProfile] = useState<AccountProfile | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true)
      setError('')

      try {
        const response = await api.getMyProfile()
        setProfile(response)
        setDisplayName(response.displayName)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Profil bilgileri yüklenemedi.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadProfile()
  }, [])

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!displayName.trim()) {
      setError('Görünen ad boş olamaz.')
      return
    }

    setIsSavingProfile(true)
    setError('')

    try {
      await api.updateMyProfile({ displayName: displayName.trim() })
      setProfile((current) => (current ? { ...current, displayName: displayName.trim() } : current))
      toast.success('Profil bilgileri güncellendi.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Profil güncellenemedi.')
    } finally {
      setIsSavingProfile(false)
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!currentPassword || !newPassword) {
      setError('Şifre alanları boş bırakılamaz.')
      return
    }

    if (newPassword.length < 6) {
      setError('Yeni şifre en az 6 karakter olmalı.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Yeni şifre ve tekrar alanı uyuşmuyor.')
      return
    }

    setIsSavingPassword(true)
    setError('')

    try {
      await api.changePassword({ currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.success('Şifren güncellendi. Tüm oturumlar yenilendi.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Şifre değiştirilemedi.')
    } finally {
      setIsSavingPassword(false)
    }
  }

  async function handleLogoutAll() {
    setIsLoggingOutAll(true)
    setError('')

    try {
      await api.logoutAllSessions()
      dispatch(logout())
      toast.success('Tüm oturumlar kapatıldı.')
      navigate('/login', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Oturumlar kapatılamadı.')
    } finally {
      setIsLoggingOutAll(false)
    }
  }

  if (isLoading) {
    return (
      <Stack spacing={2}>
        <Skeleton height={220} variant="rounded" />
        <Skeleton height={220} variant="rounded" />
        <Skeleton height={260} variant="rounded" />
      </Stack>
    )
  }

  return (
    <Stack spacing={3}>
      <StudentPageHero
        eyebrow="Profil"
        title="Profil ve Hesap Ayarları"
        description="Profil bilgilerini güncelle, şifreni değiştir ve gerekirse tüm oturumları tek noktadan kapat."
        sideContent={
          <Paper sx={{ borderRadius: 3, p: 3 }} variant="outlined">
            <Typography color="text.secondary" variant="body2">
              Hesap
            </Typography>
            <Typography sx={{ fontSize: 28, fontWeight: 900, mt: 1 }}>{profile?.displayName || currentUser?.email || 'Öğrenci'}</Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
              {profile?.email || currentUser?.email || ''}
            </Typography>
            <Chip label={profile?.role || currentUser?.role || 'Student'} sx={{ mt: 2 }} />
          </Paper>
        }
      />

      {error && <Alert severity="error">{error}</Alert>}

      <Paper component="form" onSubmit={handleProfileSubmit} sx={{ borderRadius: 3, p: 3 }} variant="outlined">
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 2 }}>
          <PersonOutlineOutlinedIcon color="primary" />
          <Typography variant="h2">Profil Bilgileri</Typography>
        </Stack>
        <Stack spacing={2}>
          <TextField disabled fullWidth label="E-posta" value={profile?.email || currentUser?.email || ''} />
          <TextField fullWidth label="Görünen Ad" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
          <TextField disabled fullWidth label="Rol" value={profile?.role || currentUser?.role || ''} />
          <Button disabled={isSavingProfile} sx={{ alignSelf: 'flex-start' }} type="submit" variant="contained">
            {isSavingProfile ? 'Kaydediliyor' : 'Profili Güncelle'}
          </Button>
        </Stack>
      </Paper>

      <Paper component="form" onSubmit={handlePasswordSubmit} sx={{ borderRadius: 3, p: 3 }} variant="outlined">
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 2 }}>
          <LockOutlinedIcon color="primary" />
          <Typography variant="h2">Şifre Değiştir</Typography>
        </Stack>
        <Stack spacing={2}>
          <TextField fullWidth label="Mevcut Şifre" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
          <TextField fullWidth helperText="En az 6 karakter kullan." label="Yeni Şifre" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
          <TextField fullWidth label="Yeni Şifre Tekrar" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
          <Button disabled={isSavingPassword} sx={{ alignSelf: 'flex-start' }} type="submit" variant="contained">
            {isSavingPassword ? 'Güncelleniyor' : 'Şifreyi Güncelle'}
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ borderRadius: 3, p: 3 }} variant="outlined">
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 2 }}>
          <LogoutOutlinedIcon color="warning" />
          <Typography variant="h2">Oturum Güvenliği</Typography>
        </Stack>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Şifre değişikliği sonrası veya paylaşılan cihaz kullanımı varsa tüm açık oturumları kapatabilirsin.
        </Typography>
        <Button color="warning" disabled={isLoggingOutAll} onClick={() => void handleLogoutAll()} variant="outlined">
          {isLoggingOutAll ? 'Kapatılıyor' : 'Tüm Oturumları Kapat'}
        </Button>
      </Paper>
    </Stack>
  )
}
