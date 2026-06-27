import { FormEvent, useMemo, useState } from 'react'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import { Box, Button, Card, CardContent, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, IconButton, InputAdornment, MenuItem, Stack, TextField, Tooltip, Typography } from '@mui/material'
import { ContentAccessLevel, ReviewStatus, type StudyNote, type Topic } from '../../models'
import { api } from '../../shared/api'
import { AdminPageHero } from '../common/AdminPageHero'
import { AdminSurface } from '../common/AdminSurface'
import { EmptyState } from '../common/EmptyState'
import { ErrorBanner } from '../common/ErrorBanner'

interface StudyNotesPageProps {
  notes: StudyNote[]
  topics: Topic[]
  onChanged: () => Promise<void>
}

const emptyForm = { content: '', isAiGenerated: false, sourceReference: '', title: '', topicId: '' }

export function StudyNotesPage({ notes, topics, onChanged }: StudyNotesPageProps) {
  const [form, setForm] = useState(emptyForm)
  const [editingNote, setEditingNote] = useState<StudyNote | null>(null)
  const [detailNote, setDetailNote] = useState<StudyNote | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<StudyNote | null>(null)
  const [topicFilter, setTopicFilter] = useState('')
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [busyId, setBusyId] = useState('')

  const filteredNotes = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('tr-TR')

    return notes.filter((note) => {
      const topic = topics.find((item) => item.id === note.topicId)
      const matchesTopic = !topicFilter || note.topicId === topicFilter
      const matchesSearch =
        !term ||
        [note.title, note.content, note.sourceReference ?? '', topic?.title ?? '']
          .join(' ')
          .toLocaleLowerCase('tr-TR')
          .includes(term)

      return matchesTopic && matchesSearch
    })
  }, [notes, search, topicFilter, topics])

  function getTopicTitle(topicId: string) {
    return topics.find((topic) => topic.id === topicId)?.title ?? 'Konu bulunamadı'
  }

  function resetForm() {
    setForm(emptyForm)
    setEditingNote(null)
    setFieldError('')
  }

  function startEdit(note: StudyNote) {
    setEditingNote(note)
    setForm({
      content: note.content,
      isAiGenerated: note.isAiGenerated,
      sourceReference: note.sourceReference ?? '',
      title: note.title,
      topicId: note.topicId,
    })
    setFieldError('')
  }

  function validateForm() {
    if (!form.topicId) return 'Konu seçmelisin.'
    if (form.title.trim().length < 3) return 'Başlık en az 3 karakter olmalı.'
    if (form.content.trim().length < 20) return 'Not içeriği en az 20 karakter olmalı.'
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
      topicId: form.topicId,
      title: form.title.trim(),
      content: form.content.trim(),
      sourceReference: form.sourceReference.trim() || null,
      isAiGenerated: form.isAiGenerated,
      reviewStatus: ReviewStatus.PendingReview,
      accessLevel: editingNote?.accessLevel ?? ContentAccessLevel.Free,
    }

    try {
      if (editingNote) await api.updateStudyNote(editingNote.id, payload)
      else await api.createStudyNote(payload)
      resetForm()
      await onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Not kaydedilemedi.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setBusyId(deleteTarget.id)
    setError('')
    try {
      await api.deleteStudyNote(deleteTarget.id)
      setDeleteTarget(null)
      await onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Not silinemedi.')
    } finally {
      setBusyId('')
    }
  }

  return (
    <Stack spacing={3}>
      <AdminPageHero
        title="Çalışma notlarını moderasyona hazır tutun."
        description="Konu bazlı ders özetlerini, kaynak referanslarını ve dış araçlarla hazırlanmış taslak notları tek yerde düzenleyin. Öğrenci tarafında yalnızca onaylı içerikler gösterileceği için not kalitesi burada belirlenir."
        actions={<Button startIcon={<AddRoundedIcon />} variant="contained" onClick={resetForm}>Yeni not</Button>}
      />
      {error && <ErrorBanner message={error} />}

      <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { lg: '0.95fr 1.05fr', xs: '1fr' } }}>
        <AdminSurface title={editingNote ? 'Notu düzenle' : 'Yeni not ekle'}>
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              {fieldError && <ErrorBanner message={fieldError} />}
              <TextField fullWidth label="Konu" required select value={form.topicId} onChange={(event) => setForm((current) => ({ ...current, topicId: event.target.value }))}>
                {topics.map((topic) => <MenuItem key={topic.id} value={topic.id}>{topic.parentTopicId ? `  - ${topic.title}` : topic.title}</MenuItem>)}
              </TextField>
              <TextField fullWidth label="Başlık" required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
              <TextField fullWidth label="İçerik" rows={6} multiline required value={form.content} onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))} />
              <TextField fullWidth label="Kaynak referansı" value={form.sourceReference} onChange={(event) => setForm((current) => ({ ...current, sourceReference: event.target.value }))} />
              <FormControlLabel control={<Checkbox checked={form.isAiGenerated} onChange={(event) => setForm((current) => ({ ...current, isAiGenerated: event.target.checked }))} />} label="Yapay zeka ile üretildi" />
              <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1.25}>
                <Button disabled={isSaving || topics.length === 0} type="submit" variant="contained">{isSaving ? 'Kaydediliyor' : editingNote ? 'Değişiklikleri kaydet' : 'Not ekle'}</Button>
                {editingNote && <Button onClick={resetForm}>Vazgeç</Button>}
              </Stack>
            </Stack>
          </Box>
        </AdminSurface>

        <AdminSurface title="Not arşivi">
          <Stack spacing={2}>
            <Stack direction={{ md: 'row', xs: 'column' }} spacing={2}>
              <TextField
                fullWidth
                label="Not ara"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> } }}
              />
              <TextField fullWidth label="Konu filtresi" select value={topicFilter} onChange={(event) => setTopicFilter(event.target.value)}>
                <MenuItem value="">Tümü</MenuItem>
                {topics.map((topic) => <MenuItem key={topic.id} value={topic.id}>{topic.parentTopicId ? `  - ${topic.title}` : topic.title}</MenuItem>)}
              </TextField>
            </Stack>

            <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { md: 'repeat(2, minmax(0, 1fr))', xs: '1fr' } }}>
              {filteredNotes.length === 0 ? (
                <EmptyState title="Not yok" description="Filtreleri temizleyebilir veya çalışma notu ekleyebilirsin." />
              ) : (
                filteredNotes.map((note) => (
                  <Card key={note.id} sx={{ borderRadius: 3 }} variant="outlined">
                    <CardContent>
                      <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                        <Chip color={note.isAiGenerated ? 'warning' : 'primary'} label={note.isAiGenerated ? 'AI kaynaklı taslak' : 'Manuel not'} size="small" />
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="Detay"><IconButton onClick={() => setDetailNote(note)}><InfoOutlinedIcon /></IconButton></Tooltip>
                          <Tooltip title="Düzenle"><IconButton onClick={() => startEdit(note)}><EditOutlinedIcon /></IconButton></Tooltip>
                          <Tooltip title="Sil"><IconButton color="error" disabled={busyId === note.id} onClick={() => setDeleteTarget(note)}><DeleteOutlineIcon /></IconButton></Tooltip>
                        </Stack>
                      </Stack>
                      <Typography sx={{ fontSize: 18, fontWeight: 900, mt: 1.5 }}>{note.title}</Typography>
                      <Typography color="text.secondary" sx={{ mt: 1 }}>{note.content}</Typography>
                      <Typography color="text.secondary" sx={{ mt: 2 }} variant="body2">{getTopicTitle(note.topicId)} · {note.sourceReference || 'Kaynak belirtilmedi'}</Typography>
                    </CardContent>
                  </Card>
                ))
              )}
            </Box>
          </Stack>
        </AdminSurface>
      </Box>

      <Dialog open={Boolean(detailNote)} onClose={() => setDetailNote(null)} maxWidth="md" fullWidth>
        <DialogTitle>Not detayı</DialogTitle>
        <DialogContent>
          {detailNote && (
            <Stack spacing={1.5}>
              <Typography><strong>Konu:</strong> {getTopicTitle(detailNote.topicId)}</Typography>
              <Typography><strong>Kaynak:</strong> {detailNote.sourceReference || 'Yok'}</Typography>
              <Typography sx={{ whiteSpace: 'pre-wrap' }}>{detailNote.content}</Typography>
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Not silinsin mi?</DialogTitle>
        <DialogContent><Typography>{deleteTarget?.title} silinecek.</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Vazgeç</Button>
          <Button color="error" disabled={Boolean(busyId)} onClick={handleDelete}>Sil</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
