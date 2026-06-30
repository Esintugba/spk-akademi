import { FormEvent, useMemo, useState } from 'react'
import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, IconButton, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { ContentAccessLevel, QuestionDifficulty, ReviewStatus, type CreateTrialExam, type License, type Question, type TrialExamSummary } from '../../models'
import { api } from '../../shared/api'
import { AdminPageHero } from '../common/AdminPageHero'
import { AdminSurface } from '../common/AdminSurface'
import { EmptyState } from '../common/EmptyState'
import { ErrorBanner } from '../common/ErrorBanner'

interface TrialExamsPageProps {
  licenses: License[]
  questions: Question[]
  trialExams: TrialExamSummary[]
  onChanged: () => Promise<void>
}

const initialForm: CreateTrialExam = {
  title: '',
  slug: '',
  description: '',
  licenseId: null,
  durationMinutes: 60,
  questionCount: 10,
  isFree: true,
  isPublished: false,
  isFeatured: false,
  difficultyLevel: QuestionDifficulty.Medium,
  tags: '',
  popularityScore: 0,
  reviewStatus: ReviewStatus.Draft,
  accessLevel: ContentAccessLevel.Free,
  questionIds: [],
}

function difficultyLabel(value: QuestionDifficulty) {
  switch (value) {
    case QuestionDifficulty.Easy:
      return 'Kolay'
    case QuestionDifficulty.Hard:
      return 'Zor'
    default:
      return 'Orta'
  }
}

export function TrialExamsPage({ licenses, questions, trialExams, onChanged }: TrialExamsPageProps) {
  const [form, setForm] = useState<CreateTrialExam>(initialForm)
  const [editingId, setEditingId] = useState('')
  const [error, setError] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isBusy, setIsBusy] = useState(false)

  const approvedQuestions = useMemo(
    () => questions.filter((question) => question.reviewStatus === 2),
    [questions],
  )

  function openCreateDialog() {
    setEditingId('')
    setForm(initialForm)
    setError('')
    setIsDialogOpen(true)
  }

  async function openEditDialog(id: string) {
    setError('')
    setIsBusy(true)

    try {
      const exam = await api.getTrialExam(id)
      setEditingId(id)
      setForm({
        title: exam.title,
        slug: exam.slug,
        description: exam.description,
        licenseId: exam.licenseId ?? null,
        durationMinutes: exam.durationMinutes,
        questionCount: exam.questionCount,
        isFree: exam.isFree,
        isPublished: exam.isPublished,
        isFeatured: exam.isFeatured,
        difficultyLevel: exam.difficultyLevel,
        tags: exam.tags ?? '',
        popularityScore: exam.popularityScore,
        reviewStatus: exam.reviewStatus,
        accessLevel: exam.accessLevel,
        questionIds: exam.questionIds,
      })
      setIsDialogOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deneme sınavı alınamadı.')
    } finally {
      setIsBusy(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!form.title.trim() || !form.slug.trim()) {
      setError('Başlık ve slug zorunludur.')
      return
    }

    if (!Number.isFinite(form.durationMinutes) || form.durationMinutes <= 0) {
      setError('Süre sıfırdan büyük olmalıdır.')
      return
    }

    if (!Number.isFinite(form.questionCount) || form.questionCount <= 0) {
      setError('Soru sayısı sıfırdan büyük olmalıdır.')
      return
    }

    if (!Number.isFinite(form.popularityScore) || form.popularityScore < 0) {
      setError('Popülerlik skoru 0 veya daha büyük olmalıdır.')
      return
    }

    if (form.questionIds.length < form.questionCount) {
      setError('Seçilen soru sayısı, sınav soru sayısından az olamaz.')
      return
    }

    setIsBusy(true)

    try {
      if (editingId) {
        await api.updateTrialExam(editingId, form)
      } else {
        await api.createTrialExam(form)
      }

      await onChanged()
      setIsDialogOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deneme sınavı kaydedilemedi.')
    } finally {
      setIsBusy(false)
    }
  }

  async function handleDelete(id: string) {
    setError('')
    setIsBusy(true)

    try {
      await api.deleteTrialExam(id)
      await onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deneme sınavı silinemedi.')
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <Stack spacing={3}>
      <AdminPageHero
        title="Deneme sınavlarını yayına hazırlayın."
        description="Ücretsiz ve özel denemeleri, süre ayarlarını ve soru eşleşmelerini tek ekranda yönetin. Öğrenci tarafındaki zamanlayıcı ve skor akışı bu içerikler üzerinden çalışır."
        actions={<Button startIcon={<AddOutlinedIcon />} variant="contained" onClick={openCreateDialog}>Deneme ekle</Button>}
      />

      {error && <ErrorBanner message={error} />}

      <AdminSurface title="Deneme listesi" description="Yayındaki, taslak ve ücretsiz sınavları içerik yoğunluğu ile birlikte görün.">
        {trialExams.length === 0 ? (
          <EmptyState title="Deneme sınavı yok" description="İlk ücretsiz deneme sınavını oluşturabilirsin." />
        ) : (
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { md: 'repeat(2, 1fr)', xs: '1fr' } }}>
            {trialExams.map((exam) => (
              <Box key={exam.id} sx={{ border: '1px solid rgba(148,163,184,0.18)', borderRadius: 3, p: 2.5 }}>
                <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between' }}>
                  <Box>
                    <Typography sx={{ fontSize: 20, fontWeight: 900 }}>{exam.title}</Typography>
                    <Typography color="text.secondary" sx={{ mt: 1 }}>{exam.description}</Typography>
                  </Box>
                  <Stack direction="row" spacing={0.5}>
                    <IconButton disabled={isBusy} onClick={() => void openEditDialog(exam.id)}><EditOutlinedIcon /></IconButton>
                    <IconButton color="error" disabled={isBusy} onClick={() => void handleDelete(exam.id)}><DeleteOutlineOutlinedIcon /></IconButton>
                  </Stack>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mt: 2 }}>
                  <Chip label={`${exam.durationMinutes} dk`} />
                  <Chip label={`${exam.questionCount} soru`} />
                  <Chip label={`${exam.assignedQuestionCount} atanmış soru`} />
                  <Chip color={exam.isFree ? 'success' : 'default'} label={exam.isFree ? 'Ücretsiz' : 'Özel'} />
                  <Chip color={exam.isPublished ? 'primary' : 'default'} label={exam.isPublished ? 'Yayında' : 'Taslak'} />
                  {exam.isFeatured && <Chip color="warning" label="Öne çıkan" />}
                  <Chip label={difficultyLabel(exam.difficultyLevel)} variant="outlined" />
                  <Chip label={`Popülerlik ${exam.popularityScore}`} variant="outlined" />
                  {exam.tags?.split(',').map((tag) => tag.trim()).filter(Boolean).slice(0, 3).map((tag) => (
                    <Chip key={tag} label={tag} size="small" variant="outlined" />
                  ))}
                </Stack>
              </Box>
            ))}
          </Box>
        )}
      </AdminSurface>

      <Dialog fullWidth maxWidth="md" open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogTitle>{editingId ? 'Deneme düzenle' : 'Deneme ekle'}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField fullWidth label="Başlık" required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value, slug: current.slug || event.target.value.toLowerCase().replace(/\s+/g, '-') }))} />
              <TextField fullWidth label="Slug" required value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} />
              <TextField fullWidth label="Açıklama" multiline rows={3} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
              <Stack direction={{ md: 'row', xs: 'column' }} spacing={2}>
                <TextField fullWidth label="Lisans" select value={form.licenseId ?? ''} onChange={(event) => setForm((current) => ({ ...current, licenseId: event.target.value || null }))}>
                  <MenuItem value="">Genel</MenuItem>
                  {licenses.map((license) => <MenuItem key={license.id} value={license.id}>{license.name}</MenuItem>)}
                </TextField>
                <TextField fullWidth label="Süre" type="number" value={form.durationMinutes} slotProps={{ htmlInput: { min: 1 } }} onChange={(event) => setForm((current) => ({ ...current, durationMinutes: Number(event.target.value) }))} />
                <TextField fullWidth label="Soru sayısı" type="number" value={form.questionCount} slotProps={{ htmlInput: { min: 1 } }} onChange={(event) => setForm((current) => ({ ...current, questionCount: Number(event.target.value) }))} />
              </Stack>
              <Stack direction={{ md: 'row', xs: 'column' }} spacing={2}>
                <TextField fullWidth label="Zorluk" select value={form.difficultyLevel} onChange={(event) => setForm((current) => ({ ...current, difficultyLevel: Number(event.target.value) as QuestionDifficulty }))}>
                  <MenuItem value={QuestionDifficulty.Easy}>Kolay</MenuItem>
                  <MenuItem value={QuestionDifficulty.Medium}>Orta</MenuItem>
                  <MenuItem value={QuestionDifficulty.Hard}>Zor</MenuItem>
                </TextField>
                <TextField fullWidth label="Popülerlik skoru" type="number" value={form.popularityScore} slotProps={{ htmlInput: { min: 0, step: 0.1 } }} onChange={(event) => setForm((current) => ({ ...current, popularityScore: Number(event.target.value) }))} />
              </Stack>
              <TextField
                fullWidth
                helperText="Virgülle ayır. Öğrenci kataloğunda arama ve etiket gösterimi için kullanılır."
                label="Etiketler"
                value={form.tags ?? ''}
                onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))}
              />
              <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
                <FormControlLabel control={<Checkbox checked={form.isFree} onChange={(event) => setForm((current) => ({ ...current, isFree: event.target.checked }))} />} label="Ücretsiz" />
                <FormControlLabel control={<Checkbox checked={form.isPublished} onChange={(event) => setForm((current) => ({ ...current, isPublished: event.target.checked }))} />} label="Yayında" />
                <FormControlLabel control={<Checkbox checked={form.isFeatured} onChange={(event) => setForm((current) => ({ ...current, isFeatured: event.target.checked }))} />} label="Öne çıkar" />
              </Stack>
              <TextField fullWidth helperText="Yalnızca onaylı sorular listelenir." label="Sorular" select slotProps={{ select: { multiple: true } }} value={form.questionIds} onChange={(event) => {
                const value = event.target.value
                setForm((current) => ({ ...current, questionIds: typeof value === 'string' ? value.split(',') : (value as string[]) }))
              }}>
                {approvedQuestions.map((question) => <MenuItem key={question.id} value={question.id}>{question.text.slice(0, 110)}</MenuItem>)}
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button disabled={isBusy} onClick={() => setIsDialogOpen(false)}>Vazgeç</Button>
            <Button disabled={isBusy} type="submit" variant="contained">{isBusy ? 'Kaydediliyor' : 'Kaydet'}</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Stack>
  )
}
