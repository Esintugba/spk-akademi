import { FormEvent, useMemo, useState } from 'react'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import { Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel, IconButton, InputAdornment, Stack, TextField, Tooltip, Typography } from '@mui/material'
import type { License } from '../../models'
import { api } from '../../shared/api'
import { AdminPageHero } from '../common/AdminPageHero'
import { AdminSurface } from '../common/AdminSurface'
import { EmptyState } from '../common/EmptyState'
import { ErrorBanner } from '../common/ErrorBanner'
import { isValidShortCode, shortCodeHelperText } from '../../utils/shortCode'

interface LicensesPageProps {
  licenses: License[]
  onChanged: () => Promise<void>
}

const emptyForm = {
  description: '',
  displayOrder: '0',
  estimatedStudyHours: '0',
  iconUrl: '',
  isActive: true,
  isFeatured: false,
  name: '',
  shortDescription: '',
  slug: '',
}

export function LicensesPage({ licenses, onChanged }: LicensesPageProps) {
  const [form, setForm] = useState(emptyForm)
  const [editingLicense, setEditingLicense] = useState<License | null>(null)
  const [detailLicense, setDetailLicense] = useState<License | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<License | null>(null)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [busyId, setBusyId] = useState('')
  const [visibleCount, setVisibleCount] = useState(12)

  const filteredLicenses = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('tr-TR')

    if (!term) {
      return licenses
    }

    return licenses.filter((license) =>
      [license.name, license.slug, license.description ?? '', license.shortDescription ?? '', license.iconUrl ?? '']
        .join(' ')
        .toLocaleLowerCase('tr-TR')
        .includes(term),
    )
  }, [licenses, search])

  function resetForm() {
    setForm(emptyForm)
    setEditingLicense(null)
    setFieldError('')
  }

  function startEdit(license: License) {
    setEditingLicense(license)
    setForm({
      description: license.description ?? '',
      displayOrder: String(license.displayOrder),
      estimatedStudyHours: String(license.estimatedStudyHours),
      iconUrl: license.iconUrl ?? '',
      isActive: license.isActive,
      isFeatured: license.isFeatured,
      name: license.name,
      shortDescription: license.shortDescription ?? '',
      slug: license.slug,
    })
    setFieldError('')
  }

  function validateForm() {
    const parsedDisplayOrder = Number(form.displayOrder)
    const parsedEstimatedStudyHours = Number(form.estimatedStudyHours)

    if (form.name.trim().length < 3) {
      return 'Lisans adı en az 3 karakter olmalı.'
    }

    if (!isValidShortCode(form.slug)) {
      return shortCodeHelperText
    }

    if (!Number.isInteger(parsedDisplayOrder) || parsedDisplayOrder < 0) {
      return 'Sıralama 0 veya daha büyük olmalı.'
    }

    if (!Number.isInteger(parsedEstimatedStudyHours) || parsedEstimatedStudyHours < 0) {
      return 'Tahmini çalışma saati 0 veya daha büyük olmalı.'
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

    setIsSaving(true)

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim() || null,
      shortDescription: form.shortDescription.trim() || null,
      iconUrl: form.iconUrl.trim() || null,
      displayOrder: Number(form.displayOrder),
      estimatedStudyHours: Number(form.estimatedStudyHours),
      isFeatured: form.isFeatured,
      isActive: form.isActive,
    }

    try {
      if (editingLicense) {
        await api.updateLicense(editingLicense.id, payload)
      } else {
        await api.createLicense(payload)
      }

      resetForm()
      await onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lisans kaydedilemedi.')
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
      await api.deleteLicense(deleteTarget.id)
      setDeleteTarget(null)
      await onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lisans silinemedi.')
    } finally {
      setBusyId('')
    }
  }

  return (
    <Stack spacing={3}>
      <AdminPageHero
        title="Lisans kataloğunu yönetin."
        description="SPK lisans türlerini, kısa kodlarını ve içerik ağacının üst seviyesini burada tanımlayın. Öğrenci erişimi ve ders organizasyonu bu yapı üzerinden şekillenir."
        actions={
          <Button startIcon={<AddRoundedIcon />} variant="contained" onClick={resetForm}>
            Yeni lisans
          </Button>
        }
        sideContent={
          <AdminSurface title="Özet" description="Her lisans birden fazla ders ve erişim paketi ile ilişkilidir.">
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              <Chip color="primary" label={`${licenses.length} lisans`} />
              <Chip label={`${licenses.reduce((total, item) => total + item.courseCount, 0)} toplam ders`} />
            </Stack>
          </AdminSurface>
        }
      />

      {error && <ErrorBanner message={error} />}

      <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { lg: '0.9fr 1.1fr', xs: '1fr' } }}>
        <AdminSurface title={editingLicense ? 'Lisansı düzenle' : 'Yeni lisans ekle'} description="Kısa kod alanını URL ve paket eşleşmeleri için temiz tutun.">
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              {fieldError && <ErrorBanner message={fieldError} />}
              <TextField
                error={Boolean(fieldError && form.name.trim().length < 3)}
                fullWidth
                helperText={fieldError && form.name.trim().length < 3 ? fieldError : 'Örn. Sermaye Piyasası Faaliyetleri Düzey 1'}
                label="Lisans adı"
                required
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
              <TextField
                error={Boolean(fieldError && !isValidShortCode(form.slug))}
                fullWidth
                helperText={fieldError && !isValidShortCode(form.slug) ? fieldError : 'Örn. duzey.1'}
                label="Kısa kod"
                required
                value={form.slug}
                onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
              />
              <TextField
                fullWidth
                label="Kısa açıklama"
                rows={2}
                multiline
                value={form.shortDescription}
                onChange={(event) => setForm((current) => ({ ...current, shortDescription: event.target.value }))}
              />
              <TextField
                fullWidth
                label="Açıklama"
                rows={4}
                multiline
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              />
              <TextField
                fullWidth
                helperText="Public lisans detayında görsel olarak kullanılabilir. Örn. /icons/licenses/duzey-1.svg"
                label="İkon URL"
                value={form.iconUrl}
                onChange={(event) => setForm((current) => ({ ...current, iconUrl: event.target.value }))}
              />
              <Stack direction={{ md: 'row', xs: 'column' }} spacing={2}>
                <TextField
                  fullWidth
                  label="Sıralama"
                  value={form.displayOrder}
                  onChange={(event) => setForm((current) => ({ ...current, displayOrder: onlyDigits(event.target.value) }))}
                  slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '[0-9]*' } }}
                />
                <TextField
                  fullWidth
                  label="Tahmini çalışma saati"
                  value={form.estimatedStudyHours}
                  onChange={(event) => setForm((current) => ({ ...current, estimatedStudyHours: onlyDigits(event.target.value) }))}
                  slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '[0-9]*' } }}
                />
              </Stack>
              <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1}>
                <FormControlLabel
                  control={<Checkbox checked={form.isFeatured} onChange={(event) => setForm((current) => ({ ...current, isFeatured: event.target.checked }))} />}
                  label="Öne çıkar"
                />
                <FormControlLabel
                  control={<Checkbox checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} />}
                  label="Aktif katalogda göster"
                />
              </Stack>
              <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1.25}>
                <Button disabled={isSaving} type="submit" variant="contained">
                  {isSaving ? 'Kaydediliyor' : editingLicense ? 'Değişiklikleri kaydet' : 'Lisans ekle'}
                </Button>
                {editingLicense && (
                  <Button disabled={isSaving} type="button" variant="outlined" onClick={resetForm}>
                    Vazgeç
                  </Button>
                )}
              </Stack>
            </Stack>
          </Box>
        </AdminSurface>

        <AdminSurface title="Lisans listesi" description="Arama yaparak mevcut lisansları hızlıca filtreleyin ve düzenleyin.">
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Lisans ara"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Stack spacing={1.5}>
              {filteredLicenses.length === 0 ? (
                <EmptyState title="Lisans yok" description="Aramayı temizleyebilir veya yeni lisans ekleyebilirsin." />
              ) : (
                filteredLicenses.slice(0, visibleCount).map((license) => (
                  <Box
                    key={license.id}
                    sx={{
                      border: '1px solid rgba(148,163,184,0.18)',
                      borderRadius: 3,
                      overflow: 'hidden',
                      p: 2.25,
                      minWidth: 0,
                    }}
                  >
                    <Stack
                      direction={{ sm: 'row', xs: 'column' }}
                      spacing={2}
                      sx={{ alignItems: { sm: 'flex-start', xs: 'stretch' }, justifyContent: 'space-between', minWidth: 0 }}
                    >
                      <Box sx={{ flex: '1 1 auto', minWidth: 0 }}>
                        <Typography sx={{ fontSize: 18, fontWeight: 900, lineHeight: 1.25, overflowWrap: 'anywhere' }}>{license.name}</Typography>
                        <Typography color="text.secondary" sx={{ mt: 0.75, overflowWrap: 'anywhere' }}>
                          {license.shortDescription || license.description || 'Açıklama girilmedi'}
                        </Typography>
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{
                            flexWrap: 'wrap',
                            gap: 1,
                            mt: 1.5,
                            minWidth: 0,
                            '& .MuiChip-root': { maxWidth: '100%' },
                            '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' },
                          }}
                        >
                          <Chip label={license.slug} size="small" />
                          <Chip color="primary" label={`${license.courseCount} ders`} size="small" />
                          <Chip color={license.isActive ? 'success' : 'default'} label={license.isActive ? 'Aktif' : 'Pasif'} size="small" />
                          {license.isFeatured && <Chip color="warning" label="Öne çıkan" size="small" />}
                          <Chip label={`Sıra ${license.displayOrder}`} size="small" variant="outlined" />
                          <Chip label={`${license.estimatedStudyHours} saat`} size="small" variant="outlined" />
                        </Stack>
                      </Box>
                      <Stack
                        direction="row"
                        spacing={0.5}
                        sx={{ alignSelf: { sm: 'flex-start', xs: 'flex-end' }, flex: '0 0 auto', flexWrap: 'nowrap', justifyContent: 'flex-end' }}
                      >
                        <Tooltip title="Detay">
                          <IconButton size="small" sx={{ flexShrink: 0 }} onClick={() => setDetailLicense(license)}>
                            <InfoOutlinedIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Düzenle">
                          <IconButton size="small" sx={{ flexShrink: 0 }} onClick={() => startEdit(license)}>
                            <EditOutlinedIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Sil">
                          <IconButton size="small" sx={{ flexShrink: 0 }} color="error" disabled={busyId === license.id} onClick={() => setDeleteTarget(license)}>
                            <DeleteOutlineIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                  </Box>
                ))
              )}
              {filteredLicenses.length > visibleCount && (
                <Button variant="outlined" onClick={() => setVisibleCount((current) => current + 12)}>
                  {filteredLicenses.length - visibleCount} lisans daha göster
                </Button>
              )}
            </Stack>
          </Stack>
        </AdminSurface>
      </Box>

      <Dialog open={Boolean(detailLicense)} onClose={() => setDetailLicense(null)}>
        <DialogTitle>Lisans detayı</DialogTitle>
        <DialogContent>
          {detailLicense && (
            <Stack divider={<Divider flexItem />} spacing={1.5} sx={{ minWidth: { sm: 360, xs: 0 }, width: '100%' }}>
              <Typography><strong>Ad:</strong> {detailLicense.name}</Typography>
              <Typography><strong>Kısa kod:</strong> {detailLicense.slug}</Typography>
              <Typography><strong>Kısa açıklama:</strong> {detailLicense.shortDescription || 'Yok'}</Typography>
              <Typography><strong>İkon URL:</strong> {detailLicense.iconUrl || 'Yok'}</Typography>
              <Typography><strong>Sıralama:</strong> {detailLicense.displayOrder}</Typography>
              <Typography><strong>Tahmini çalışma:</strong> {detailLicense.estimatedStudyHours} saat</Typography>
              <Typography><strong>Katalog durumu:</strong> {detailLicense.isActive ? 'Aktif' : 'Pasif'}</Typography>
              <Typography><strong>Öne çıkan:</strong> {detailLicense.isFeatured ? 'Evet' : 'Hayır'}</Typography>
              <Typography><strong>Ders sayısı:</strong> {detailLicense.courseCount}</Typography>
              <Typography>{detailLicense.description || 'Açıklama girilmedi.'}</Typography>
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Lisans silinsin mi?</DialogTitle>
        <DialogContent>
          <Typography>
            {deleteTarget?.name} silinirse bağlı dersler ve içerikler de etkilenebilir.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Vazgeç</Button>
          <Button color="error" disabled={Boolean(busyId)} onClick={handleDelete}>
            Sil
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, '')
}
