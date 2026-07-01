import { FormEvent, useMemo, useState } from 'react'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, MenuItem, Stack, TextField, Tooltip, Typography } from '@mui/material'
import type { Course, License } from '../../models'
import { api } from '../../shared/api'
import { AdminPageHero } from '../common/AdminPageHero'
import { AdminSurface } from '../common/AdminSurface'
import { EmptyState } from '../common/EmptyState'
import { ErrorBanner } from '../common/ErrorBanner'
import { isValidShortCode, shortCodeHelperText } from '../../utils/shortCode'

interface CoursesPageProps {
  courses: Course[]
  licenses: License[]
  onChanged: () => Promise<void>
}

const emptyForm = { description: '', licenseId: '', name: '', order: '1', slug: '' }

export function CoursesPage({ courses, licenses, onChanged }: CoursesPageProps) {
  const [form, setForm] = useState(emptyForm)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [detailCourse, setDetailCourse] = useState<Course | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null)
  const [licenseFilter, setLicenseFilter] = useState('')
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [busyId, setBusyId] = useState('')
  const [visibleCount, setVisibleCount] = useState(12)

  const filteredCourses = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('tr-TR')

    return courses.filter((course) => {
      const license = licenses.find((item) => item.id === course.licenseId)
      const matchesLicense = !licenseFilter || course.licenseId === licenseFilter
      const matchesSearch =
        !term ||
        [course.name, course.slug, course.description ?? '', license?.name ?? '']
          .join(' ')
          .toLocaleLowerCase('tr-TR')
          .includes(term)

      return matchesLicense && matchesSearch
    })
  }, [courses, licenseFilter, licenses, search])

  function getLicenseName(licenseId: string) {
    return licenses.find((license) => license.id === licenseId)?.name ?? 'Lisans bulunamadı'
  }

  function resetForm() {
    setForm({ ...emptyForm, order: String(Math.max(1, courses.length + 1)) })
    setEditingCourse(null)
    setFieldError('')
  }

  function startEdit(course: Course) {
    setEditingCourse(course)
    setForm({
      description: course.description ?? '',
      licenseId: course.licenseId,
      name: course.name,
      order: String(course.order),
      slug: course.slug,
    })
    setFieldError('')
  }

  function validateForm() {
    const parsedOrder = Number(form.order)

    if (!form.licenseId) return 'Lisans seçmelisin.'
    if (form.name.trim().length < 3) return 'Ders adı en az 3 karakter olmalı.'
    if (!isValidShortCode(form.slug)) return shortCodeHelperText
    if (!Number.isInteger(parsedOrder) || parsedOrder < 1) return 'Sıra 1 veya daha büyük olmalı.'
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
      licenseId: form.licenseId,
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim() || null,
      order: Number(form.order),
    }

    try {
      if (editingCourse) {
        await api.updateCourse(editingCourse.id, payload)
      } else {
        await api.createCourse(payload)
      }

      resetForm()
      await onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ders kaydedilemedi.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return

    setBusyId(deleteTarget.id)
    setError('')

    try {
      await api.deleteCourse(deleteTarget.id)
      setDeleteTarget(null)
      await onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ders silinemedi.')
    } finally {
      setBusyId('')
    }
  }

  return (
    <Stack spacing={3}>
      <AdminPageHero
        title="Ders yapısını lisans bazında kurun."
        description="Her lisansın altında yer alan modülleri, sıralarını ve kısa kodlarını burada tanımlayın. Konu ve PDF akışı bu yapı üzerinden ilerler."
        actions={
          <Button startIcon={<AddRoundedIcon />} variant="contained" onClick={resetForm}>
            Yeni ders
          </Button>
        }
      />

      {error && <ErrorBanner message={error} />}

      <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { lg: '0.95fr 1.05fr', xs: '1fr' } }}>
        <AdminSurface title={editingCourse ? 'Dersi düzenle' : 'Yeni ders ekle'} description="Ders sırası öğrenci tarafındaki listeleme akışını belirler.">
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                error={Boolean(fieldError && !form.licenseId)}
                fullWidth
                helperText={fieldError && !form.licenseId ? fieldError : 'Bu dersin bağlı olduğu lisansı seçin.'}
                label="Lisans"
                required
                select
                value={form.licenseId}
                onChange={(event) => setForm((current) => ({ ...current, licenseId: event.target.value }))}
              >
                {licenses.map((license) => (
                  <MenuItem key={license.id} value={license.id}>
                    {license.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                helperText="Örn. Finansal Piyasalar"
                label="Ders adı"
                required
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
              <Stack direction={{ md: 'row', xs: 'column' }} spacing={2}>
                <TextField
                  fullWidth
                  helperText={fieldError && !isValidShortCode(form.slug) ? fieldError : 'Örn. finansal.piyasalar_1'}
                  label="Kısa kod"
                  required
                  value={form.slug}
                  onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
                />
                <TextField
                  fullWidth
                  helperText={fieldError && (!Number.isInteger(Number(form.order)) || Number(form.order) < 1) ? fieldError : 'Öğrenci tarafındaki görünüm sırası'}
                  label="Sıra"
                  slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '[0-9]*' } }}
                  value={form.order}
                  onChange={(event) => setForm((current) => ({ ...current, order: onlyDigits(event.target.value) }))}
                />
              </Stack>
              <TextField
                fullWidth
                label="Açıklama"
                rows={4}
                multiline
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              />
              <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1.25}>
                <Button disabled={isSaving || licenses.length === 0} type="submit" variant="contained">
                  {isSaving ? 'Kaydediliyor' : editingCourse ? 'Değişiklikleri kaydet' : 'Ders ekle'}
                </Button>
                {editingCourse && <Button onClick={resetForm}>Vazgeç</Button>}
              </Stack>
            </Stack>
          </Box>
        </AdminSurface>

        <AdminSurface title="Ders listesi" description="Lisans bazında filtreleyin, arayın ve konu yoğunluğunu takip edin.">
          <Stack spacing={2}>
            <Stack direction={{ md: 'row', xs: 'column' }} spacing={2}>
              <TextField
                fullWidth
                label="Ders ara"
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
              <TextField fullWidth label="Lisans filtresi" select value={licenseFilter} onChange={(event) => setLicenseFilter(event.target.value)}>
                <MenuItem value="">Tümü</MenuItem>
                {licenses.map((license) => (
                  <MenuItem key={license.id} value={license.id}>
                    {license.name}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <Stack spacing={1.5}>
              {filteredCourses.length === 0 ? (
                <EmptyState title="Ders yok" description="Filtreyi temizleyebilir veya yeni ders ekleyebilirsin." />
              ) : (
                filteredCourses.slice(0, visibleCount).map((course) => (
                  <Box key={course.id} sx={{ border: '1px solid rgba(148,163,184,0.18)', borderRadius: 3, overflow: 'hidden', p: 2.25, minWidth: 0 }}>
                    <Stack
                      direction={{ sm: 'row', xs: 'column' }}
                      spacing={2}
                      sx={{ alignItems: { sm: 'flex-start', xs: 'stretch' }, justifyContent: 'space-between', minWidth: 0 }}
                    >
                      <Box sx={{ flex: '1 1 auto', minWidth: 0 }}>
                        <Typography sx={{ fontSize: 18, fontWeight: 900, lineHeight: 1.25, overflowWrap: 'anywhere' }}>
                          {course.order}. {course.name}
                        </Typography>
                        <Typography color="text.secondary" sx={{ mt: 0.75, overflowWrap: 'anywhere' }}>
                          {course.description || 'Açıklama girilmedi'}
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
                          <Chip label={getLicenseName(course.licenseId)} size="small" />
                          <Chip color="primary" label={`${course.topicCount} konu`} size="small" />
                          <Chip label={course.slug} size="small" />
                        </Stack>
                      </Box>
                      <Stack
                        direction="row"
                        spacing={0.5}
                        sx={{ alignSelf: { sm: 'flex-start', xs: 'flex-end' }, flex: '0 0 auto', flexWrap: 'nowrap', justifyContent: 'flex-end' }}
                      >
                        <Tooltip title="Detay"><IconButton size="small" sx={{ flexShrink: 0 }} onClick={() => setDetailCourse(course)}><InfoOutlinedIcon /></IconButton></Tooltip>
                        <Tooltip title="Düzenle"><IconButton size="small" sx={{ flexShrink: 0 }} onClick={() => startEdit(course)}><EditOutlinedIcon /></IconButton></Tooltip>
                        <Tooltip title="Sil"><IconButton size="small" sx={{ flexShrink: 0 }} color="error" disabled={busyId === course.id} onClick={() => setDeleteTarget(course)}><DeleteOutlineIcon /></IconButton></Tooltip>
                      </Stack>
                    </Stack>
                  </Box>
                ))
              )}
              {filteredCourses.length > visibleCount && (
                <Button variant="outlined" onClick={() => setVisibleCount((current) => current + 12)}>
                  {filteredCourses.length - visibleCount} ders daha göster
                </Button>
              )}
            </Stack>
          </Stack>
        </AdminSurface>
      </Box>

      <Dialog open={Boolean(detailCourse)} onClose={() => setDetailCourse(null)}>
        <DialogTitle>Ders detayı</DialogTitle>
        <DialogContent>
          {detailCourse && (
            <Stack spacing={1} sx={{ minWidth: { sm: 360, xs: 0 }, width: '100%' }}>
              <Typography><strong>Ders:</strong> {detailCourse.name}</Typography>
              <Typography><strong>Lisans:</strong> {getLicenseName(detailCourse.licenseId)}</Typography>
              <Typography><strong>Kısa kod:</strong> {detailCourse.slug}</Typography>
              <Typography><strong>Sıra:</strong> {detailCourse.order}</Typography>
              <Typography><strong>Konu:</strong> {detailCourse.topicCount}</Typography>
              <Typography>{detailCourse.description || 'Açıklama girilmedi.'}</Typography>
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Ders silinsin mi?</DialogTitle>
        <DialogContent><Typography>{deleteTarget?.name} silinecek.</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Vazgeç</Button>
          <Button color="error" disabled={Boolean(busyId)} onClick={handleDelete}>Sil</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, '')
}
