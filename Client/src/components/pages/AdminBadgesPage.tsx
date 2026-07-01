import { FormEvent, useEffect, useMemo, useState } from 'react'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import type { Badge, BadgeCategory as BadgeCategoryType, BadgeRequirementType as BadgeRequirementTypeValue, UpsertBadge } from '../../models'
import { BadgeCategory, BadgeRequirementType } from '../../models'
import { api } from '../../shared/api'
import { resolveApiAssetUrl } from '../../shared/api/assets'
import { AdminPageHero } from '../common/AdminPageHero'
import { AdminSurface } from '../common/AdminSurface'
import { EmptyState } from '../common/EmptyState'
import { ErrorBanner } from '../common/ErrorBanner'

const categoryLabels: Record<BadgeCategoryType, string> = {
  [BadgeCategory.Streak]: 'Seri',
  [BadgeCategory.Accuracy]: 'Doğruluk',
  [BadgeCategory.Practice]: 'Pratik',
  [BadgeCategory.Review]: 'Tekrar',
  [BadgeCategory.Speed]: 'Zaman',
  [BadgeCategory.CourseCompletion]: 'Tamamlama',
}

const requirementLabels: Record<BadgeRequirementTypeValue, string> = {
  [BadgeRequirementType.QuizCount]: 'Quiz sayısı',
  [BadgeRequirementType.StreakDays]: 'Streak günü',
  [BadgeRequirementType.PerfectQuizCount]: 'Hatasız quiz',
  [BadgeRequirementType.LateNightStudyCount]: 'Gece çalışması',
  [BadgeRequirementType.ReviewQuestionCount]: 'Tekrar sorusu',
  [BadgeRequirementType.TotalXp]: 'Toplam XP',
  [BadgeRequirementType.DailyGoalCompletionCount]: 'Günlük hedef',
  [BadgeRequirementType.TopicCompletionCount]: 'Tamamlanan konu',
  [BadgeRequirementType.CourseCompletionCount]: 'Tamamlanan ders',
}

const emptyForm: UpsertBadge = {
  name: '',
  description: '',
  iconUrl: '/icons/badges/first-step.svg',
  xpReward: 20,
  category: BadgeCategory.Practice,
  requirementType: BadgeRequirementType.QuizCount,
  requirementValue: 1,
  isHidden: false,
}

export function AdminBadgesPage() {
  const [badges, setBadges] = useState<Badge[]>([])
  const [form, setForm] = useState<UpsertBadge>(emptyForm)
  const [editing, setEditing] = useState<Badge | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Badge | null>(null)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [busyId, setBusyId] = useState('')

  const filteredBadges = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('tr-TR')
    if (!term) {
      return badges
    }

    return badges.filter((badge) =>
      [
        badge.name,
        badge.description,
        categoryLabels[badge.category],
        requirementLabels[badge.requirementType],
      ]
        .join(' ')
        .toLocaleLowerCase('tr-TR')
        .includes(term),
    )
  }, [badges, search])

  async function loadBadges() {
    setIsLoading(true)
    setError('')

    try {
      setBadges(await api.getAdminBadges())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rozetler yüklenemedi.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadBadges()
  }, [])

  function resetForm() {
    setForm(emptyForm)
    setEditing(null)
    setFieldError('')
  }

  function startEdit(badge: Badge) {
    setEditing(badge)
    setForm({
      name: badge.name,
      description: badge.description,
      iconUrl: badge.iconUrl,
      xpReward: badge.xpReward,
      category: badge.category,
      requirementType: badge.requirementType,
      requirementValue: badge.requirementValue,
      isHidden: badge.isHidden,
    })
    setFieldError('')
  }

  function validateForm() {
    if (form.name.trim().length < 3) {
      return 'Rozet adı en az 3 karakter olmalıdır.'
    }

    if (form.description.trim().length < 10) {
      return 'Açıklama en az 10 karakter olmalıdır.'
    }

    if (!form.iconUrl.trim()) {
      return 'İkon yolu zorunludur.'
    }

    if (form.xpReward < 0 || form.requirementValue < 1) {
      return 'XP negatif olamaz ve koşul değeri en az 1 olmalıdır.'
    }

    return ''
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const validationError = validateForm()
    if (validationError) {
      setFieldError(validationError)
      return
    }

    const payload: UpsertBadge = {
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      iconUrl: form.iconUrl.trim(),
      xpReward: Number(form.xpReward),
      requirementValue: Number(form.requirementValue),
    }

    setIsSaving(true)
    try {
      if (editing) {
        await api.updateAdminBadge(editing.id, payload)
      } else {
        await api.createAdminBadge(payload)
      }

      resetForm()
      await loadBadges()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rozet kaydedilemedi.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return
    }

    setBusyId(deleteTarget.id)
    setError('')

    try {
      await api.deleteAdminBadge(deleteTarget.id)
      setDeleteTarget(null)
      await loadBadges()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rozet silinemedi.')
    } finally {
      setBusyId('')
    }
  }

  return (
    <Stack spacing={3}>
      <AdminPageHero
        eyebrow="Gamification"
        title="Rozet katalogu"
        description="Öğrencilerin açabileceği rozetleri, koşul eşiklerini, XP ödüllerini ve gizli rozet davranışlarını yönetin."
        actions={
          <Button startIcon={<RefreshRoundedIcon />} onClick={() => void loadBadges()} variant="outlined">
            Yenile
          </Button>
        }
      />

      {error && <ErrorBanner message={error} />}

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { lg: '0.9fr 1.4fr', xs: '1fr' } }}>
        <AdminSurface
          title={editing ? 'Rozeti düzenle' : 'Yeni rozet'}
          description="Koşul tipi ilerleme verisinin hangi kaynaktan hesaplanacağını belirler."
        >
          <Box component="form" onSubmit={(event) => void handleSubmit(event)}>
            <Stack spacing={2}>
              <TextField
                label="Ad"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
              <TextField
                label="Açıklama"
                rows={3}
                multiline
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              />
              <TextField
                label="İkon yolu"
                value={form.iconUrl}
                onChange={(event) => setForm((current) => ({ ...current, iconUrl: event.target.value }))}
              />
              <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { sm: '1fr 1fr', xs: '1fr' } }}>
                <TextField
                  label="Kategori"
                  select
                  value={form.category}
                  onChange={(event) => setForm((current) => ({ ...current, category: Number(event.target.value) as BadgeCategoryType }))}
                >
                  {Object.values(BadgeCategory).map((value) => (
                    <MenuItem key={value} value={value}>
                      {categoryLabels[value]}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Koşul tipi"
                  select
                  value={form.requirementType}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, requirementType: Number(event.target.value) as BadgeRequirementTypeValue }))
                  }
                >
                  {Object.values(BadgeRequirementType).map((value) => (
                    <MenuItem key={value} value={value}>
                      {requirementLabels[value]}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Koşul değeri"
                  slotProps={{ htmlInput: { min: 1 } }}
                  type="number"
                  value={form.requirementValue}
                  onChange={(event) => setForm((current) => ({ ...current, requirementValue: Number(event.target.value) }))}
                />
                <TextField
                  label="XP ödülü"
                  slotProps={{ htmlInput: { min: 0 } }}
                  type="number"
                  value={form.xpReward}
                  onChange={(event) => setForm((current) => ({ ...current, xpReward: Number(event.target.value) }))}
                />
              </Box>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Switch
                  checked={form.isHidden}
                  onChange={(event) => setForm((current) => ({ ...current, isHidden: event.target.checked }))}
                />
                <Typography>Gizli rozet</Typography>
              </Stack>
              {fieldError && <ErrorBanner message={fieldError} />}
              <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1}>
                <Button disabled={isSaving} startIcon={<AddRoundedIcon />} type="submit" variant="contained">
                  {isSaving ? 'Kaydediliyor' : editing ? 'Değişiklikleri kaydet' : 'Rozet ekle'}
                </Button>
                {editing && (
                  <Button onClick={resetForm} variant="outlined">
                    Vazgeç
                  </Button>
                )}
              </Stack>
            </Stack>
          </Box>
        </AdminSurface>

        <AdminSurface title="Rozetler" description={`${badges.length} rozet katalogda kayıtlı.`}>
          <Stack spacing={2}>
            <TextField
              placeholder="Rozet ara"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon />
                    </InputAdornment>
                  ),
                },
              }}
            />

            {isLoading && <Typography color="text.secondary">Rozetler yükleniyor...</Typography>}
            {!isLoading && filteredBadges.length === 0 && <EmptyState title="Rozet bulunamadı" description="Arama terimini temizleyin veya yeni rozet ekleyin." />}

            <Stack spacing={1.25}>
              {filteredBadges.map((badge) => (
                <Box
                  key={badge.id}
                  sx={{
                    alignItems: { md: 'center', xs: 'flex-start' },
                    border: '1px solid rgba(148,163,184,0.2)',
                    borderRadius: 2,
                    display: 'grid',
                    gap: 1.5,
                    gridTemplateColumns: { md: '48px 1fr auto', xs: '48px 1fr' },
                    p: 1.5,
                  }}
                >
                  <Box alt="" component="img" src={resolveApiAssetUrl(badge.iconUrl)} sx={{ height: 42, width: 42 }} />
                  <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                      <Typography sx={{ fontWeight: 900 }}>{badge.name}</Typography>
                      {badge.isHidden && <Chip label="Gizli" size="small" />}
                    </Stack>
                    <Typography color="text.secondary" sx={{ lineHeight: 1.6 }} variant="body2">
                      {badge.description}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mt: 1 }}>
                      <Chip label={categoryLabels[badge.category]} size="small" />
                      <Chip label={`${requirementLabels[badge.requirementType]}: ${badge.requirementValue}`} size="small" variant="outlined" />
                      <Chip color="primary" label={`+${badge.xpReward} XP`} size="small" variant="outlined" />
                    </Stack>
                  </Box>
                  <Stack direction="row" spacing={0.5} sx={{ gridColumn: { md: 'auto', xs: '2' }, justifyContent: 'flex-end' }}>
                    <Tooltip title="Düzenle">
                      <IconButton onClick={() => startEdit(badge)}>
                        <EditOutlinedIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Sil">
                      <IconButton disabled={busyId === badge.id} onClick={() => setDeleteTarget(badge)}>
                        <DeleteOutlineOutlinedIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Stack>
        </AdminSurface>
      </Box>

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Rozeti sil</DialogTitle>
        <DialogContent>
          <Typography>
            {deleteTarget?.name} rozetini silmek istediğinizden emin misiniz? Kazanılmış rozetler silinemez.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Vazgeç</Button>
          <Button color="error" disabled={Boolean(busyId)} onClick={() => void handleDelete()} variant="contained">
            Sil
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
