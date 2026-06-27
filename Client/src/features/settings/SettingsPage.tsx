import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined'
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined'
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined'
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  FormControlLabel,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { type ChangeEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'react-toastify'
import { logout } from '../../app/authSlice'
import { useAppDispatch } from '../../app/hooks'
import { StudentPageHero } from '../../components/common/StudentPageHero'
import {
  dateFormatOptions,
  languageOptions,
  pdfViewOptions,
  questionTransitionOptions,
  quizModeOptions,
  themeOptions,
  timeFormatOptions,
  type UpdateUserSettings,
  type UserSettings,
  UserQuestionTransitionPreference,
} from '../../models'
import { api, settingsApi } from '../../shared/api'
import { useLocalization } from '../../shared/localization'

export function SettingsPage() {
  const { t } = useLocalization()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const settingsQuery = useQuery({ queryKey: ['settings'], queryFn: settingsApi.get })
  const securityQuery = useQuery({ queryKey: ['settings', 'security'], queryFn: settingsApi.getSecurity })
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    if (settingsQuery.data) {
      setSettings({
        ...settingsQuery.data,
        questionTransition:
          settingsQuery.data.questionTransition === UserQuestionTransitionPreference.AfterCorrectAnswer
            ? UserQuestionTransitionPreference.AfterAnswer
            : settingsQuery.data.questionTransition,
      })
    }
  }, [settingsQuery.data])

  useEffect(() => {
    if (securityQuery.data) {
      setDisplayName(securityQuery.data.displayName)
    }
  }, [securityQuery.data])

  const saveMutation = useMutation({
    mutationFn: (payload: UpdateUserSettings) => settingsApi.updatePreferences(payload),
    onSuccess: async (response) => {
      setSettings(response)
      queryClient.setQueryData(['settings'], response)
      await queryClient.invalidateQueries({ queryKey: ['settings'] })
      toast.success(t('Ayarlar kaydedildi.'))
    },
  })

  const profileMutation = useMutation({
    mutationFn: () => api.updateMyProfile({ displayName: displayName.trim() }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['settings', 'security'] })
      toast.success(t('Hesap bilgileri güncellendi.'))
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('Hesap güncellenemedi.')),
  })

  const passwordMutation = useMutation({
    mutationFn: () => api.changePassword({ currentPassword, newPassword }),
    onSuccess: () => {
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.success(t('Şifre güncellendi.'))
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('Şifre güncellenemedi.')),
  })

  const logoutAllMutation = useMutation({
    mutationFn: api.logoutAllSessions,
    onSuccess: () => {
      dispatch(logout())
      toast.success(t('Tüm oturumlar kapatıldı.'))
      navigate('/login', { replace: true })
    },
  })

  if (settingsQuery.isLoading || !settings) {
    return (
      <Stack spacing={3}>
        <Skeleton height={220} variant="rounded" />
        <Skeleton height={320} variant="rounded" />
        <Skeleton height={320} variant="rounded" />
      </Stack>
    )
  }

  if (settingsQuery.isError) {
    return <Alert severity="error">{settingsQuery.error instanceof Error ? settingsQuery.error.message : t('Ayarlar yüklenemedi.')}</Alert>
  }

  const update = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings((current) => (current ? { ...current, [key]: value } : current))
  }

  const save = () => saveMutation.mutate(toUpdatePayload(settings))
  const canChangePassword = currentPassword.length > 0 && newPassword.length >= 6 && newPassword === confirmPassword

  return (
    <Stack spacing={3}>
      <StudentPageHero
        eyebrow={t('Ayarlar')}
        title={t('Platform deneyimini kendine göre ayarla.')}
        description={t('Bildirimler, çalışma hedefleri, quiz davranışı, PDF okuyucu, görünüm, dil ve güvenlik tercihleri tek merkezde.')}
        actions={
          <Button disabled={saveMutation.isPending} onClick={save} startIcon={<SaveOutlinedIcon />} variant="contained">
            {t('Ayarları Kaydet')}
          </Button>
        }
        sideContent={
          <Paper sx={{ borderRadius: 3, p: 2.5 }} variant="outlined">
            <Typography color="text.secondary" variant="body2">{t('Aktif profil')}</Typography>
            <Typography sx={{ fontSize: 24, fontWeight: 900, mt: 1 }}>{securityQuery.data?.displayName || t('Öğrenci')}</Typography>
            <Typography color="text.secondary" variant="body2">{securityQuery.data?.email}</Typography>
            <Chip label={t(settings.compactView ? 'Kompakt görünüm' : 'Standart görünüm')} sx={{ mt: 2 }} />
          </Paper>
        }
      />

      {saveMutation.isError && <Alert severity="error">{saveMutation.error instanceof Error ? saveMutation.error.message : t('Ayarlar kaydedilemedi.')}</Alert>}

      <SettingsSection icon={<PersonOutlineOutlinedIcon />} title={t('Hesap')}>
        <Stack spacing={2}>
          <TextField disabled fullWidth label={t('E-posta')} value={securityQuery.data?.email ?? ''} />
          <TextField fullWidth label={t('Görünen ad')} onChange={(event) => setDisplayName(event.target.value)} value={displayName} />
          <Button disabled={!displayName.trim() || profileMutation.isPending} onClick={() => profileMutation.mutate()} sx={{ alignSelf: 'flex-start' }} variant="outlined">
            {t('Hesabı Güncelle')}
          </Button>
        </Stack>
      </SettingsSection>

      <NotificationSettings settings={settings} update={update} />
      <StudyPreferences settings={settings} update={update} />
      <QuizPreferences settings={settings} update={update} />
      <PdfPreferences settings={settings} update={update} />
      <AppearanceSettings settings={settings} update={update} />

      <SettingsSection icon={<LockOutlinedIcon />} title={t('Gizlilik ve Güvenlik')}>
        <SecuritySettings
          activeSessionCount={securityQuery.data?.activeSessionCount ?? 0}
          canChangePassword={canChangePassword}
          confirmPassword={confirmPassword}
          currentPassword={currentPassword}
          emailConfirmed={securityQuery.data?.emailConfirmed ?? false}
          isChangingPassword={passwordMutation.isPending}
          isLoggingOutAll={logoutAllMutation.isPending}
          newPassword={newPassword}
          refreshTokenExpiresAt={securityQuery.data?.refreshTokenExpiresAt}
          securityNotifications={settings.securityNotifications}
          setConfirmPassword={setConfirmPassword}
          setCurrentPassword={setCurrentPassword}
          setNewPassword={setNewPassword}
          twoFactorReady={securityQuery.data?.twoFactorReady ?? false}
          update={update}
          onChangePassword={() => passwordMutation.mutate()}
          onLogoutAll={() => logoutAllMutation.mutate()}
        />
      </SettingsSection>
    </Stack>
  )
}

function NotificationSettings({ settings, update }: SettingsGroupProps) {
  const { t } = useLocalization()
  const updatePushNotifications = (value: boolean) => {
    update('pushNotifications', value)

    if (!value || typeof window === 'undefined') {
      return
    }

    if (!('Notification' in window)) {
      update('pushNotifications', false)
      toast.info(t('Bu tarayıcı bildirimleri desteklemiyor.'))
      return
    }

    if (Notification.permission === 'denied') {
      update('pushNotifications', false)
      toast.info(t('Tarayıcı bildirimi izni verilmedi.'))
      return
    }

    if (Notification.permission === 'default') {
      void Notification.requestPermission().then((permission) => {
        if (permission === 'denied') {
          update('pushNotifications', false)
          toast.info(t('Tarayıcı bildirimi izni verilmedi.'))
        }
      })
    }
  }

  return (
    <SettingsSection icon={<NotificationsOutlinedIcon />} title="Bildirimler">
      <ToggleGrid>
        <SettingSwitch label="E-posta bildirimleri" checked={settings.emailNotifications} onChange={(value) => update('emailNotifications', value)} />
        <SettingSwitch label="Tarayıcı bildirimleri" checked={settings.pushNotifications} onChange={updatePushNotifications} />
        <SettingSwitch label="Yeni içerik bildirimleri" checked={settings.newContentNotifications} onChange={(value) => update('newContentNotifications', value)} />
        <SettingSwitch label="Deneme hatırlatmaları" checked={settings.trialReminders} onChange={(value) => update('trialReminders', value)} />
        <SettingSwitch label="Tekrar zamanı bildirimleri" checked={settings.reviewReminder} onChange={(value) => update('reviewReminder', value)} />
        <SettingSwitch label="Hedef hatırlatmaları" checked={settings.dailyGoalReminder} onChange={(value) => update('dailyGoalReminder', value)} />
        <SettingSwitch label="Haftalık hedef bildirimleri" checked={settings.weeklyGoalReminder} onChange={(value) => update('weeklyGoalReminder', value)} />
        <SettingSwitch label="Çalışma hatırlatmaları" checked={settings.studyReminders} onChange={(value) => update('studyReminders', value)} />
        <SettingSwitch label="Destek talebi güncellemeleri" checked={settings.supportTicketUpdates} onChange={(value) => update('supportTicketUpdates', value)} />
      </ToggleGrid>
    </SettingsSection>
  )
}

function StudyPreferences({ settings, update }: SettingsGroupProps) {
  const { t } = useLocalization()
  return (
    <SettingsSection icon={<SchoolOutlinedIcon />} title="Çalışma Tercihleri">
      <FieldGrid>
        <NumberField label="Günlük hedef soru sayısı" value={settings.dailyGoalQuestionCount} onChange={(value) => update('dailyGoalQuestionCount', value)} />
        <NumberField label="Günlük çalışma süresi" suffix="dk" value={settings.dailyStudyMinutes} onChange={(value) => update('dailyStudyMinutes', value)} />
        <TextField
          fullWidth
          label={t('Sınav tarihi')}
          onChange={(event) => update('examDate', event.target.value ? `${event.target.value}T00:00:00.000Z` : null)}
          slotProps={{ inputLabel: { shrink: true } }}
          type="date"
          value={settings.examDate ? settings.examDate.slice(0, 10) : ''}
        />
        <NumberField label="Haftalık çalışma süresi" suffix="dk" value={settings.weeklyStudyMinutes} onChange={(value) => update('weeklyStudyMinutes', value)} />
        <TextField
          fullWidth
          helperText={t('0=Pazar, 1=Pazartesi ... 6=Cumartesi. Örnek: 1,2,3,4,5')}
          label={t('Çalışma günleri')}
          onChange={(event) => update('preferredStudyDays', event.target.value)}
          value={settings.preferredStudyDays}
        />
        <SelectField label="Varsayılan quiz modu" options={quizModeOptions} value={settings.defaultQuizMode} onChange={(value) => update('defaultQuizMode', value)} />
        <NumberField label="Varsayılan soru sayısı" value={settings.defaultQuestionCount} onChange={(value) => update('defaultQuestionCount', value)} />
      </FieldGrid>
      <SettingSwitch label="Otomatik tekrar önerileri" checked={settings.autoReviewSuggestions} onChange={(value) => update('autoReviewSuggestions', value)} />
    </SettingsSection>
  )
}

function QuizPreferences({ settings, update }: SettingsGroupProps) {
  return (
    <SettingsSection icon={<QuizOutlinedIcon />} title="Quiz Tercihleri">
      <FieldGrid>
        <SelectField label="Soru geçiş davranışı" options={questionTransitionOptions} value={settings.questionTransition} onChange={(value) => update('questionTransition', value)} />
        <NumberField label="Varsayılan quiz süresi" suffix="dk" value={settings.defaultQuizDurationMinutes} onChange={(value) => update('defaultQuizDurationMinutes', value)} />
      </FieldGrid>
      <ToggleGrid>
        <SettingSwitch label="Varsayılan süreli mod" checked={settings.timedQuizDefault} onChange={(value) => update('timedQuizDefault', value)} />
        <SettingSwitch label="Sonuç ekranında açıklamaları otomatik aç" checked={settings.autoOpenExplanations} onChange={(value) => update('autoOpenExplanations', value)} />
        <SettingSwitch label="Yanlışları tekrar kuyruğuna otomatik ekle" checked={settings.autoAddWrongAnswersToReview} onChange={(value) => update('autoAddWrongAnswersToReview', value)} />
      </ToggleGrid>
    </SettingsSection>
  )
}

function PdfPreferences({ settings, update }: SettingsGroupProps) {
  return (
    <SettingsSection icon={<ArticleOutlinedIcon />} title="PDF ve Not Alma">
      <FieldGrid>
        <SelectField label="Varsayılan PDF görünümü" options={pdfViewOptions} value={settings.preferredPdfView} onChange={(value) => update('preferredPdfView', value)} />
      </FieldGrid>
      <ToggleGrid>
        <SettingSwitch label="Son kaldığım sayfayı hatırla" checked={settings.rememberLastPdfPage} onChange={(value) => update('rememberLastPdfPage', value)} />
        <SettingSwitch label="Notları otomatik kaydet" checked={settings.autoSaveNotes} onChange={(value) => update('autoSaveNotes', value)} />
        <SettingSwitch label="Vurguları göster" checked={settings.showHighlights} onChange={(value) => update('showHighlights', value)} />
      </ToggleGrid>
    </SettingsSection>
  )
}

function AppearanceSettings({ settings, update }: SettingsGroupProps) {
  return (
    <SettingsSection icon={<PaletteOutlinedIcon />} title="Görünüm, Dil ve Bölgesel Ayarlar">
      <FieldGrid>
        <SelectField label="Tema" options={themeOptions} value={settings.theme} onChange={(value) => update('theme', value)} />
        <SelectField label="Dil" options={languageOptions} value={settings.language} onChange={(value) => update('language', value)} />
        <SelectField label="Tarih formatı" options={dateFormatOptions} value={settings.dateFormat} onChange={(value) => update('dateFormat', value)} />
        <SelectField label="Saat formatı" options={timeFormatOptions} value={settings.timeFormat} onChange={(value) => update('timeFormat', value)} />
      </FieldGrid>
      <SettingSwitch label="Yoğun/kompakt görünüm" checked={settings.compactView} onChange={(value) => update('compactView', value)} />
    </SettingsSection>
  )
}

function SecuritySettings({
  activeSessionCount,
  canChangePassword,
  confirmPassword,
  currentPassword,
  emailConfirmed,
  isChangingPassword,
  isLoggingOutAll,
  newPassword,
  refreshTokenExpiresAt,
  securityNotifications,
  setConfirmPassword,
  setCurrentPassword,
  setNewPassword,
  twoFactorReady,
  update,
  onChangePassword,
  onLogoutAll,
}: SecuritySettingsProps) {
  const { formatDateTime, t } = useLocalization()
  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { md: 'repeat(3, 1fr)', xs: '1fr' } }}>
        <InfoTile label={t('Aktif oturumlar')} value={String(activeSessionCount)} />
        <InfoTile label={t('E-posta doğrulama')} value={t(emailConfirmed ? 'Doğrulandı' : 'Bekliyor')} />
        <InfoTile label={t('2FA hazırlığı')} value={t(twoFactorReady ? 'Aktif' : 'Hazır değil')} />
      </Box>
      <Typography color="text.secondary" variant="body2">
        {t('Son oturum yenileme bitişi')}: {formatDateTime(refreshTokenExpiresAt)}
      </Typography>
      <SettingSwitch label="Güvenlik bildirimleri" checked={securityNotifications} onChange={(value) => update('securityNotifications', value)} />
      <Divider />
      <Stack spacing={1.5}>
        <Typography sx={{ fontWeight: 900 }}>{t('Şifre değiştir')}</Typography>
        <TextField fullWidth label={t('Mevcut şifre')} onChange={(event) => setCurrentPassword(event.target.value)} type="password" value={currentPassword} />
        <TextField fullWidth helperText={t('En az 6 karakter kullan.')} label={t('Yeni şifre')} onChange={(event) => setNewPassword(event.target.value)} type="password" value={newPassword} />
        <TextField fullWidth label={t('Yeni şifre tekrar')} onChange={(event) => setConfirmPassword(event.target.value)} type="password" value={confirmPassword} />
        <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1.5}>
          <Button disabled={!canChangePassword || isChangingPassword} onClick={onChangePassword} startIcon={<SecurityOutlinedIcon />} variant="contained">
            {t('Şifreyi Güncelle')}
          </Button>
          <Button color="warning" disabled={isLoggingOutAll} onClick={onLogoutAll} variant="outlined">
            {t('Tüm Cihazlardan Çıkış')}
          </Button>
        </Stack>
      </Stack>
    </Stack>
  )
}

function SettingsSection({ children, icon, title }: { children: React.ReactNode; icon: React.ReactNode; title: string }) {
  const { t } = useLocalization()
  return (
    <Paper sx={{ borderRadius: 3, p: { md: 3, xs: 2.5 } }} variant="outlined">
      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 2.5 }}>
        <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
        <Typography sx={{ fontSize: 24, fontWeight: 900 }}>{t(title)}</Typography>
      </Stack>
      {children}
    </Paper>
  )
}

function ToggleGrid({ children }: { children: React.ReactNode }) {
  return <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { md: 'repeat(2, 1fr)', xs: '1fr' } }}>{children}</Box>
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { md: 'repeat(2, 1fr)', xs: '1fr' }, mb: 2 }}>{children}</Box>
}

function SettingSwitch({ checked, label, onChange }: { checked: boolean; label: string; onChange: (value: boolean) => void }) {
  const { t } = useLocalization()
  return (
    <FormControlLabel
      control={<Switch checked={checked} onChange={(event) => onChange(event.target.checked)} />}
      label={t(label.trim())}
      sx={{ border: '1px solid rgba(148,163,184,0.16)', borderRadius: 2, m: 0, px: 1.5, py: 0.75 }}
    />
  )
}

function NumberField({ label, onChange, suffix, value }: { label: string; onChange: (value: number) => void; suffix?: string; value: number }) {
  const { t } = useLocalization()
  return (
    <TextField
      fullWidth
      label={t(label)}
      onChange={(event) => onChange(Number(event.target.value))}
      slotProps={{ input: { endAdornment: suffix ? <Typography color="text.secondary">{suffix}</Typography> : undefined } }}
      type="number"
      value={value}
    />
  )
}

function SelectField<T extends number>({
  label,
  onChange,
  options,
  value,
}: {
  label: string
  onChange: (value: T) => void
  options: ReadonlyArray<{ value: T; label: string }>
  value: T
}) {
  const { t } = useLocalization()
  return (
    <TextField fullWidth label={t(label)} onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(Number(event.target.value) as T)} select value={value}>
      {options.map((option) => <MenuItem key={option.value} value={option.value}>{t(option.label)}</MenuItem>)}
    </TextField>
  )
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <Paper sx={{ borderRadius: 2, p: 1.5 }} variant="outlined">
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <AccessTimeOutlinedIcon color="primary" fontSize="small" />
        <Box>
          <Typography color="text.secondary" variant="body2">{label}</Typography>
          <Typography sx={{ fontWeight: 900 }}>{value}</Typography>
        </Box>
      </Stack>
    </Paper>
  )
}

function toUpdatePayload(settings: UserSettings): UpdateUserSettings {
  return {
    theme: settings.theme,
    language: settings.language,
    dateFormat: settings.dateFormat,
    timeFormat: settings.timeFormat,
    compactView: settings.compactView,
    emailNotifications: settings.emailNotifications,
    pushNotifications: settings.pushNotifications,
    newContentNotifications: settings.newContentNotifications,
    trialReminders: settings.trialReminders,
    reviewReminder: settings.reviewReminder,
    dailyGoalReminder: settings.dailyGoalReminder,
    weeklyGoalReminder: settings.weeklyGoalReminder,
    studyReminders: settings.studyReminders,
    supportTicketUpdates: settings.supportTicketUpdates,
    dailyGoalQuestionCount: settings.dailyGoalQuestionCount,
    dailyStudyMinutes: settings.dailyStudyMinutes,
    examDate: settings.examDate,
    weeklyStudyMinutes: settings.weeklyStudyMinutes,
    preferredStudyDays: settings.preferredStudyDays,
    defaultQuizMode: settings.defaultQuizMode,
    defaultQuestionCount: settings.defaultQuestionCount,
    autoReviewSuggestions: settings.autoReviewSuggestions,
    timedQuizDefault: settings.timedQuizDefault,
    defaultQuizDurationMinutes: settings.defaultQuizDurationMinutes,
    autoOpenExplanations: settings.autoOpenExplanations,
    questionTransition: settings.questionTransition,
    autoAddWrongAnswersToReview: settings.autoAddWrongAnswersToReview,
    preferredPdfView: settings.preferredPdfView,
    rememberLastPdfPage: settings.rememberLastPdfPage,
    autoSaveNotes: settings.autoSaveNotes,
    showHighlights: settings.showHighlights,
    securityNotifications: settings.securityNotifications,
  }
}

type SettingsGroupProps = {
  settings: UserSettings
  update: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void
}

type SecuritySettingsProps = {
  activeSessionCount: number
  canChangePassword: boolean
  confirmPassword: string
  currentPassword: string
  emailConfirmed: boolean
  isChangingPassword: boolean
  isLoggingOutAll: boolean
  newPassword: string
  refreshTokenExpiresAt?: string | null
  securityNotifications: boolean
  setConfirmPassword: (value: string) => void
  setCurrentPassword: (value: string) => void
  setNewPassword: (value: string) => void
  twoFactorReady: boolean
  update: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void
  onChangePassword: () => void
  onLogoutAll: () => void
}
