import { FormEvent, useCallback, useMemo, useState } from 'react'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, MenuItem, Stack, TextField, Tooltip, Typography } from '@mui/material'
import { TopicType, type Course, type Topic } from '../../models'
import { api } from '../../shared/api'
import { AdminPageHero } from '../common/AdminPageHero'
import { AdminSurface } from '../common/AdminSurface'
import { EmptyState } from '../common/EmptyState'
import { ErrorBanner } from '../common/ErrorBanner'
import { isValidShortCode, shortCodeHelperText } from '../../utils/shortCode'

interface TopicsPageProps {
  courses: Course[]
  topics: Topic[]
  onChanged: () => Promise<void>
}

const emptyForm = {
  commonMistakes: '',
  criticalThresholds: '',
  courseId: '',
  examNotes: '',
  formulas: '',
  importantPoints: '',
  order: '1',
  parentTopicId: '',
  slug: '',
  summary: '',
  title: '',
  type: TopicType.MainTopic,
}

export function TopicsPage({ courses, topics, onChanged }: TopicsPageProps) {
  const [form, setForm] = useState(emptyForm)
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null)
  const [detailTopic, setDetailTopic] = useState<Topic | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Topic | null>(null)
  const [courseFilter, setCourseFilter] = useState('')
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [busyId, setBusyId] = useState('')
  const [visibleCount, setVisibleCount] = useState(24)

  const filteredTopics = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('tr-TR')

    return topics.filter((topic) => {
      const course = courses.find((item) => item.id === topic.courseId)
      const matchesCourse = !courseFilter || topic.courseId === courseFilter
      const matchesSearch =
        !term ||
        [topic.title, topic.slug, topic.summary ?? '', topic.importantPoints ?? '', topic.parentTopicTitle ?? '', course?.name ?? '']
          .join(' ')
          .toLocaleLowerCase('tr-TR')
          .includes(term)

      return matchesCourse && matchesSearch
    })
  }, [courseFilter, courses, search, topics])

  function getCourseName(courseId: string) {
    return courses.find((course) => course.id === courseId)?.name ?? 'Ders bulunamadı'
  }

  function getTopicLabel(topic: Topic) {
    return `${topic.parentTopicId ? '  - ' : ''}${topic.order}. ${topic.title}`
  }

  const getDescendantIds = useCallback((topicId: string) => {
    const result = new Set<string>()
    const collect = (parentId: string) => {
      topics
        .filter((topic) => topic.parentTopicId === parentId)
        .forEach((topic) => {
          result.add(topic.id)
          collect(topic.id)
        })
    }

    collect(topicId)
    return result
  }, [topics])

  const availableParentTopics = useMemo(() => {
    if (!form.courseId) return []

    const excludedIds = editingTopic ? getDescendantIds(editingTopic.id) : new Set<string>()
    if (editingTopic) excludedIds.add(editingTopic.id)

    return topics.filter((topic) => topic.courseId === form.courseId && topic.type === TopicType.MainTopic && !excludedIds.has(topic.id))
  }, [editingTopic, form.courseId, getDescendantIds, topics])

  function resetForm() {
    setForm({ ...emptyForm, order: String(Math.max(1, topics.length + 1)) })
    setEditingTopic(null)
    setFieldError('')
  }

  function startEdit(topic: Topic) {
    setEditingTopic(topic)
    setForm({
      commonMistakes: topic.commonMistakes ?? '',
      criticalThresholds: topic.criticalThresholds ?? '',
      courseId: topic.courseId,
      examNotes: topic.examNotes ?? '',
      formulas: topic.formulas ?? '',
      importantPoints: topic.importantPoints ?? '',
      order: String(topic.order),
      parentTopicId: topic.parentTopicId ?? '',
      slug: topic.slug,
      summary: topic.summary ?? '',
      title: topic.title,
      type: topic.type ?? (topic.parentTopicId ? TopicType.SubTopic : TopicType.MainTopic),
    })
    setFieldError('')
  }

  function validateForm() {
    const parsedOrder = Number(form.order)

    if (!form.courseId) return 'Ders seçmelisin.'
    if (form.type === TopicType.SubTopic && !form.parentTopicId) return 'Alt konu için ana konu seçmelisin.'
    if (form.type === TopicType.SubTopic && !availableParentTopics.some((topic) => topic.id === form.parentTopicId)) return 'Geçerli bir ana konu seçmelisin.'
    if (form.title.trim().length < 3) return 'Başlık en az 3 karakter olmalı.'
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
      courseId: form.courseId,
      parentTopicId: form.type === TopicType.SubTopic ? form.parentTopicId || null : null,
      type: form.type,
      title: form.title.trim(),
      slug: form.slug.trim(),
      order: Number(form.order),
      summary: form.summary.trim() || null,
      importantPoints: form.importantPoints.trim() || null,
      commonMistakes: form.commonMistakes.trim() || null,
      formulas: form.formulas.trim() || null,
      examNotes: form.examNotes.trim() || null,
      criticalThresholds: form.criticalThresholds.trim() || null,
    }

    try {
      if (editingTopic) await api.updateTopic(editingTopic.id, payload)
      else await api.createTopic(payload)
      resetForm()
      await onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Konu kaydedilemedi.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setBusyId(deleteTarget.id)
    setError('')
    try {
      await api.deleteTopic(deleteTarget.id)
      setDeleteTarget(null)
      await onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Konu silinemedi.')
    } finally {
      setBusyId('')
    }
  }

  const isSubTopicForm = form.type === TopicType.SubTopic
  const summaryLabel = isSubTopicForm ? 'Tanım' : 'Ana konu özeti'
  const importantPointsLabel = isSubTopicForm ? 'Soru çözüm ipuçları' : 'Önemli noktalar'
  const commonMistakesLabel = isSubTopicForm ? 'Karıştırılan kavramlar' : 'Sık yapılan hatalar'
  const formulasLabel = isSubTopicForm ? 'Süreler / oranlar / hesaplamalar' : 'Formüller / süreler / oranlar'
  const examNotesLabel = isSubTopicForm ? 'Kurul kararları ve sınav notları' : 'Sınav notları'

  return (
    <Stack spacing={3}>
      <AdminPageHero
        title="Konuları küçük ve çalışılabilir parçalara ayırın."
        description="Her dersi öğrenci açısından sindirilebilir konu bloklarına bölün. Özet, önemli noktalar, sık hatalar ve formüller alanları hem öğrenci ekranlarını hem de editoryal içerik akışını besler."
        actions={
          <Button startIcon={<AddRoundedIcon />} variant="contained" onClick={resetForm}>
            Yeni konu
          </Button>
        }
      />

      {error && <ErrorBanner message={error} />}

      <Box sx={{ alignItems: 'start', display: 'grid', gap: 2.5, gridTemplateColumns: { lg: 'minmax(0, 0.95fr) minmax(0, 1.05fr)', xs: 'minmax(0, 1fr)' } }}>
        <AdminSurface title={editingTopic ? 'Konuyu düzenle' : 'Yeni konu ekle'} description="Ders, sıra ve slug alanları öğrenci yönlendirmesi için kritiktir.">
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              {fieldError && <ErrorBanner message={fieldError} />}
              <TextField fullWidth label="Ders" required select value={form.courseId} onChange={(event) => setForm((current) => ({ ...current, courseId: event.target.value, parentTopicId: '' }))}>
                {courses.map((course) => <MenuItem key={course.id} value={course.id}>{course.name}</MenuItem>)}
              </TextField>
              <TextField fullWidth label="Tür" required select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: Number(event.target.value) as TopicType, parentTopicId: '' }))}>
                <MenuItem value={TopicType.MainTopic}>Ana konu</MenuItem>
                <MenuItem value={TopicType.SubTopic}>Alt konu</MenuItem>
              </TextField>
              {isSubTopicForm && (
                <TextField fullWidth label="Ana konu seç" required select value={form.parentTopicId} onChange={(event) => setForm((current) => ({ ...current, parentTopicId: event.target.value }))}>
                  <MenuItem value="">Ana konu seç</MenuItem>
                  {availableParentTopics.map((topic) => <MenuItem key={topic.id} value={topic.id}>{getTopicLabel(topic)}</MenuItem>)}
                </TextField>
              )}
              <TextField fullWidth label="Başlık" required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
              <Stack direction={{ md: 'row', xs: 'column' }} spacing={2}>
                <TextField fullWidth label="Kısa kod" required value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} />
                <TextField
                  fullWidth
                  label="Sıra"
                  slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '[0-9]*' } }}
                  value={form.order}
                  onChange={(event) => setForm((current) => ({ ...current, order: onlyDigits(event.target.value) }))}
                />
              </Stack>
              <TextField fullWidth label={summaryLabel} rows={3} multiline value={form.summary} onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))} />
              <TextField fullWidth label={importantPointsLabel} rows={3} multiline value={form.importantPoints} onChange={(event) => setForm((current) => ({ ...current, importantPoints: event.target.value }))} />
              <TextField fullWidth label={commonMistakesLabel} rows={3} multiline value={form.commonMistakes} onChange={(event) => setForm((current) => ({ ...current, commonMistakes: event.target.value }))} />
              <TextField fullWidth label={formulasLabel} rows={3} multiline value={form.formulas} onChange={(event) => setForm((current) => ({ ...current, formulas: event.target.value }))} />
              <TextField fullWidth label={examNotesLabel} rows={3} multiline value={form.examNotes} onChange={(event) => setForm((current) => ({ ...current, examNotes: event.target.value }))} />
              <TextField fullWidth label="Kritik eşikler" rows={3} multiline value={form.criticalThresholds} onChange={(event) => setForm((current) => ({ ...current, criticalThresholds: event.target.value }))} />
              <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1.25}>
                <Button disabled={isSaving || courses.length === 0} type="submit" variant="contained">{isSaving ? 'Kaydediliyor' : editingTopic ? 'Değişiklikleri kaydet' : 'Konu ekle'}</Button>
                {editingTopic && <Button onClick={resetForm}>Vazgeç</Button>}
              </Stack>
            </Stack>
          </Box>
        </AdminSurface>

        <AdminSurface title="Konu listesi" description="Özet, soru yoğunluğu ve bağlı ders bilgisiyle konuları tarayın.">
          <Stack spacing={2}>
            <Stack direction={{ md: 'row', xs: 'column' }} spacing={2}>
              <TextField
                fullWidth
                label="Konu ara"
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
              <TextField fullWidth label="Ders filtresi" select value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)}>
                <MenuItem value="">Tümü</MenuItem>
                {courses.map((course) => <MenuItem key={course.id} value={course.id}>{course.name}</MenuItem>)}
              </TextField>
            </Stack>

            <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))' }}>
              {filteredTopics.length === 0 ? (
                <EmptyState title="Konu yok" description="Filtreleri temizleyebilir veya yeni konu ekleyebilirsin." />
              ) : (
                filteredTopics.slice(0, visibleCount).map((topic) => (
                  <Box key={topic.id} sx={{ border: '1px solid rgba(148,163,184,0.18)', borderRadius: 3, minWidth: 0, p: 2.25 }}>
                    <Stack direction="row" sx={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 1, justifyContent: 'space-between', minWidth: 0 }}>
                      <Chip color={topic.type === TopicType.SubTopic ? 'default' : 'primary'} label={topic.type === TopicType.SubTopic ? `${topic.order}. alt konu` : `${topic.order}. ana konu`} size="small" />
                      <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                        <Tooltip title="Detay"><IconButton onClick={() => setDetailTopic(topic)}><InfoOutlinedIcon /></IconButton></Tooltip>
                        <Tooltip title="Düzenle"><IconButton onClick={() => startEdit(topic)}><EditOutlinedIcon /></IconButton></Tooltip>
                        <Tooltip title="Sil"><IconButton color="error" disabled={busyId === topic.id} onClick={() => setDeleteTarget(topic)}><DeleteOutlineIcon /></IconButton></Tooltip>
                      </Stack>
                    </Stack>
                    <Typography sx={{ fontSize: 18, fontWeight: 900, mt: 1.5, overflowWrap: 'anywhere', pl: topic.parentTopicId ? 2 : 0 }}>{topic.title}</Typography>
                    <Typography color="text.secondary" sx={{ mt: 1 }}>{topic.summary || 'Kısa özet henüz girilmedi.'}</Typography>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mt: 1.75 }}>
                      <Chip label={getCourseName(topic.courseId)} size="small" />
                      {topic.parentTopicTitle && <Chip label={`Ana konu: ${topic.parentTopicTitle}`} size="small" variant="outlined" />}
                      {(topic.subTopicCount ?? 0) > 0 && <Chip label={`${topic.subTopicCount} alt konu`} size="small" variant="outlined" />}
                      <Chip color="primary" label={`${topic.questionCount} soru`} size="small" />
                    </Stack>
                  </Box>
                ))
              )}
            </Box>
            {filteredTopics.length > visibleCount && (
              <Button variant="outlined" onClick={() => setVisibleCount((current) => current + 24)}>
                {filteredTopics.length - visibleCount} konu daha göster
              </Button>
            )}
          </Stack>
        </AdminSurface>
      </Box>

      <Dialog open={Boolean(detailTopic)} onClose={() => setDetailTopic(null)} maxWidth="md" fullWidth>
        <DialogTitle>Konu detayı</DialogTitle>
        <DialogContent>
          {detailTopic && (
            <Stack spacing={1.5}>
              <Typography><strong>Ders:</strong> {getCourseName(detailTopic.courseId)}</Typography>
              <Typography><strong>Tür:</strong> {detailTopic.type === TopicType.SubTopic ? 'Alt konu' : 'Ana konu'}</Typography>
              {detailTopic.parentTopicTitle && <Typography><strong>Ana konu:</strong> {detailTopic.parentTopicTitle}</Typography>}
              <Typography><strong>Kısa kod:</strong> {detailTopic.slug}</Typography>
              <Typography><strong>Alt konu sayısı:</strong> {detailTopic.subTopicCount ?? 0}</Typography>
              <Typography><strong>Soru sayısı:</strong> {detailTopic.questionCount}</Typography>
              <Typography><strong>Özet:</strong> {detailTopic.summary || 'Yok'}</Typography>
              <Typography><strong>Önemli noktalar:</strong> {detailTopic.importantPoints || 'Yok'}</Typography>
              <Typography><strong>Sık hatalar:</strong> {detailTopic.commonMistakes || 'Yok'}</Typography>
              <Typography><strong>Formüller:</strong> {detailTopic.formulas || 'Yok'}</Typography>
              <Typography><strong>Sınav notları:</strong> {detailTopic.examNotes || 'Yok'}</Typography>
              <Typography><strong>Kritik eşikler:</strong> {detailTopic.criticalThresholds || 'Yok'}</Typography>
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Konu silinsin mi?</DialogTitle>
        <DialogContent><Typography>{deleteTarget?.title} silinecek.</Typography></DialogContent>
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
