import { FormEvent, useMemo, useState } from 'react'
import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { Alert, Autocomplete, Box, Button, Checkbox, Chip, FormControlLabel, IconButton, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { ContentAccessLevel, ReviewStatus, TrialExamDifficulty, type Course, type CreateTrialExam, type License, type Question, type Topic, type TrialExamSummary } from '../../models'
import { api } from '../../shared/api'
import { AdminPageHero } from '../common/AdminPageHero'
import { AdminFormDrawer } from '../common/AdminFormDrawer'
import { AdminSurface } from '../common/AdminSurface'
import { EmptyState } from '../common/EmptyState'
import { ErrorBanner } from '../common/ErrorBanner'

interface TrialExamsPageProps {
  courses: Course[]
  licenses: License[]
  questions: Question[]
  topics: Topic[]
  trialExams: TrialExamSummary[]
  onChanged: () => Promise<void>
}

const initialForm: CreateTrialExam = {
  title: '',
  slug: '',
  description: '',
  licenseId: null,
  courseId: null,
  topicIds: [],
  durationMinutes: 60,
  questionCount: 10,
  isFree: true,
  isPublished: false,
  isFeatured: false,
  difficultyLevel: TrialExamDifficulty.Medium,
  tags: '',
  popularityScore: 0,
  reviewStatus: ReviewStatus.PendingReview,
  accessLevel: ContentAccessLevel.Free,
  questionIds: [],
  autoSelectQuestions: true,
}

function difficultyLabel(value: TrialExamDifficulty) {
  switch (value) {
    case TrialExamDifficulty.All:
      return 'Tümü'
    case TrialExamDifficulty.Easy:
      return 'Kolay'
    case TrialExamDifficulty.Hard:
      return 'Zor'
    default:
      return 'Orta'
  }
}

function reviewStatusLabel(value: ReviewStatus) {
  switch (value) {
    case ReviewStatus.Approved:
      return 'Onaylandı'
    case ReviewStatus.PendingReview:
      return 'Onay bekliyor'
    case ReviewStatus.NeedsRevision:
      return 'Düzeltme gerekli'
    case ReviewStatus.Rejected:
      return 'Reddedildi'
    default:
      return 'Taslak'
  }
}

export function TrialExamsPage({ courses, licenses, questions, topics, trialExams, onChanged }: TrialExamsPageProps) {
  const [form, setForm] = useState<CreateTrialExam>(initialForm)
  const [editingId, setEditingId] = useState('')
  const [error, setError] = useState('')
  const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false)
  const [isBusy, setIsBusy] = useState(false)

  const approvedQuestions = useMemo(
    () => questions.filter((question) => question.reviewStatus === ReviewStatus.Approved),
    [questions],
  )
  const approvedQuestionTopicIds = useMemo(
    () => new Set(approvedQuestions.map((question) => question.topicId)),
    [approvedQuestions],
  )
  const courseById = useMemo(() => new Map(courses.map((course) => [course.id, course])), [courses])
  const topicById = useMemo(() => new Map(topics.map((topic) => [topic.id, topic])), [topics])
  const availableCourses = useMemo(
    () => form.licenseId ? courses.filter((course) => course.licenseId === form.licenseId) : [],
    [courses, form.licenseId],
  )
  const availableTopics = useMemo(
    () => form.courseId
      ? topics.filter((topic) => topic.courseId === form.courseId && approvedQuestionTopicIds.has(topic.id))
      : [],
    [approvedQuestionTopicIds, form.courseId, topics],
  )
  const approvedQuestionsForScope = useMemo(() => {
    if (!form.licenseId) {
      return approvedQuestions
    }

    const courseIds = new Set(
      courses.filter((course) => course.licenseId === form.licenseId).map((course) => course.id),
    )
    const topicIds = new Set(
      topics.filter((topic) => courseIds.has(topic.courseId)).map((topic) => topic.id),
    )
    return approvedQuestions.filter((question) => {
      const topic = topicById.get(question.topicId)
      if (!topicIds.has(question.topicId) || !topic) return false
      if (form.courseId && topic.courseId !== form.courseId) return false
      if (form.topicIds.length > 0 && !form.topicIds.includes(question.topicId)) return false
      return true
    })
  }, [approvedQuestions, courses, form.courseId, form.licenseId, form.topicIds, topicById, topics])

  function getQuestionScopeLabel(question: Question) {
    const topic = topicById.get(question.topicId)
    const course = topic ? courseById.get(topic.courseId) : undefined
    return [course?.name, topic?.title].filter(Boolean).join(' › ')
  }

  function openCreateDialog() {
    setEditingId('')
    setForm(initialForm)
    setError('')
    setIsFormDrawerOpen(true)
  }

  async function openEditDialog(id: string) {
    setError('')
    setIsBusy(true)

    try {
      const exam = await api.getTrialExam(id)
      const selectedQuestions = questions.filter((question) => exam.questionIds.includes(question.id))
      const selectedTopicIds = [...new Set(selectedQuestions.map((question) => question.topicId))]
      const selectedCourseIds = [...new Set(
        selectedTopicIds
          .map((topicId) => topicById.get(topicId)?.courseId)
          .filter((courseId): courseId is string => Boolean(courseId)),
      )]
      const inferredCourseId = exam.licenseId &&
        selectedCourseIds.length === 1 &&
        courseById.get(selectedCourseIds[0])?.licenseId === exam.licenseId
        ? selectedCourseIds[0]
        : null
      setEditingId(id)
      setForm({
        title: exam.title,
        slug: exam.slug,
        description: exam.description,
        licenseId: exam.licenseId ?? null,
        courseId: inferredCourseId,
        topicIds: inferredCourseId ? selectedTopicIds : [],
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
        autoSelectQuestions: false,
      })
      setIsFormDrawerOpen(true)
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

    if (form.autoSelectQuestions && !form.licenseId) {
      setError('Otomatik soru seçimi için bir lisans seçmelisin.')
      return
    }

    if (form.autoSelectQuestions && approvedQuestionsForScope.length < form.questionCount) {
      setError(`Seçilen kapsamda ${approvedQuestionsForScope.length} onaylı soru var; ${form.questionCount} soru atanamaz.`)
      return
    }

    if (!form.autoSelectQuestions && form.questionIds.length < form.questionCount) {
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
      setIsFormDrawerOpen(false)
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
                  <Chip color={exam.reviewStatus === ReviewStatus.Approved ? 'success' : 'warning'} label={reviewStatusLabel(exam.reviewStatus)} />
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

      <AdminFormDrawer
        open={isFormDrawerOpen}
        title={editingId ? 'Deneme düzenle' : 'Deneme ekle'}
        onClose={() => setIsFormDrawerOpen(false)}
      >
        <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField fullWidth label="Başlık" required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value, slug: current.slug || event.target.value.toLowerCase().replace(/\s+/g, '-') }))} />
              <TextField fullWidth label="Slug" required value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} />
              <TextField fullWidth label="Açıklama" multiline rows={3} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
              <Stack direction={{ md: 'row', xs: 'column' }} spacing={2}>
                <TextField fullWidth label="Lisans" select value={form.licenseId ?? ''} onChange={(event) => setForm((current) => ({
                  ...current,
                  licenseId: event.target.value || null,
                  courseId: null,
                  topicIds: [],
                  questionIds: [],
                }))}>
                  <MenuItem value="">Genel</MenuItem>
                  {licenses.map((license) => <MenuItem key={license.id} value={license.id}>{license.name}</MenuItem>)}
                </TextField>
                <TextField fullWidth label="Süre" type="number" value={form.durationMinutes} slotProps={{ htmlInput: { min: 1 } }} onChange={(event) => setForm((current) => ({ ...current, durationMinutes: Number(event.target.value) }))} />
                <TextField fullWidth label="Soru sayısı" type="number" value={form.questionCount} slotProps={{ htmlInput: { min: 1 } }} onChange={(event) => setForm((current) => ({ ...current, questionCount: Number(event.target.value) }))} />
              </Stack>
              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { md: 'repeat(2, minmax(0, 1fr))', xs: 'minmax(0, 1fr)' } }}>
                <TextField
                  disabled={!form.licenseId}
                  fullWidth
                  helperText={form.licenseId ? 'Boş bırakırsan lisansın tüm dersleri kullanılır.' : 'Önce lisans seçmelisin.'}
                  label="Ders kapsamı"
                  select
                  slotProps={{
                    inputLabel: { shrink: true },
                    select: {
                      displayEmpty: true,
                      renderValue: (selected) => {
                        const selectedCourseId = String(selected ?? '')
                        if (!form.licenseId) return 'Önce lisans seç'
                        return selectedCourseId
                          ? availableCourses.find((course) => course.id === selectedCourseId)?.name ?? 'Ders seç'
                          : 'Tüm dersler'
                      },
                    },
                  }}
                  value={form.courseId ?? ''}
                  onChange={(event) => setForm((current) => ({
                    ...current,
                    courseId: event.target.value || null,
                    topicIds: [],
                    questionIds: [],
                  }))}
                >
                  <MenuItem value="">Tüm dersler</MenuItem>
                  {availableCourses.map((course) => <MenuItem key={course.id} value={course.id}>{course.name}</MenuItem>)}
                </TextField>
                <Autocomplete
                  disabled={!form.courseId}
                  getOptionLabel={(topic) => topic.parentTopicTitle ? `${topic.parentTopicTitle} › ${topic.title}` : topic.title}
                  getLimitTagsText={(more) => `+${more} konu`}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  limitTags={1}
                  multiple
                  onChange={(_, selectedTopics) => setForm((current) => ({
                    ...current,
                    topicIds: selectedTopics.map((topic) => topic.id),
                    questionIds: [],
                  }))}
                  options={availableTopics}
                  sx={{
                    minWidth: 0,
                    '& .MuiAutocomplete-inputRoot': { minWidth: 0 },
                    '& .MuiChip-root': { maxWidth: 'calc(100% - 48px)' },
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      helperText={form.courseId ? 'Boş bırakırsan dersin tüm konuları kullanılır.' : 'Önce ders seçmelisin.'}
                      label="Konu kapsamı"
                      placeholder={!form.courseId ? 'Önce ders seç' : form.topicIds.length === 0 ? 'Tüm konular' : 'Konu ara ve seç'}
                    />
                  )}
                  value={availableTopics.filter((topic) => form.topicIds.includes(topic.id))}
                />
              </Box>
              <Stack direction={{ md: 'row', xs: 'column' }} spacing={2}>
                <TextField fullWidth label="Zorluk" select value={form.difficultyLevel} onChange={(event) => setForm((current) => ({ ...current, difficultyLevel: Number(event.target.value) as TrialExamDifficulty }))}>
                  <MenuItem value={TrialExamDifficulty.All}>Tümü</MenuItem>
                  <MenuItem value={TrialExamDifficulty.Easy}>Kolay</MenuItem>
                  <MenuItem value={TrialExamDifficulty.Medium}>Orta</MenuItem>
                  <MenuItem value={TrialExamDifficulty.Hard}>Zor</MenuItem>
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
                <FormControlLabel control={<Checkbox checked={form.isFree} onChange={(event) => setForm((current) => ({ ...current, isFree: event.target.checked }))} />} label="Ücretsiz (erişim izni gerekir)" />
                <FormControlLabel control={<Checkbox checked={form.isPublished} onChange={(event) => setForm((current) => ({ ...current, isPublished: event.target.checked }))} />} label="Yayında" />
                <FormControlLabel control={<Checkbox checked={form.isFeatured} onChange={(event) => setForm((current) => ({ ...current, isFeatured: event.target.checked }))} />} label="Öne çıkar" />
              </Stack>
              {form.isPublished && form.reviewStatus !== ReviewStatus.Approved && (
                <Alert severity="info">
                  Deneme kaydedildikten sonra Moderasyon ekranından onaylanana kadar öğrencilere görünmez.
                </Alert>
              )}
              <FormControlLabel
                control={(
                  <Checkbox
                    checked={form.autoSelectQuestions}
                    onChange={(event) => setForm((current) => ({
                      ...current,
                      autoSelectQuestions: event.target.checked,
                      questionIds: event.target.checked ? [] : current.questionIds,
                    }))}
                  />
                )}
                label="Soruları seçilen lisans, ders ve konu kapsamından rastgele seç"
              />
              {form.autoSelectQuestions ? (
                <Alert severity={approvedQuestionsForScope.length < form.questionCount ? 'warning' : 'success'}>
                  Seçilen kapsamda {approvedQuestionsForScope.length} onaylı soru var. Kaydettiğinde bunlardan {form.questionCount || 0} tanesi rastgele atanır.
                </Alert>
              ) : (
                <Autocomplete
                  disableCloseOnSelect
                  filterSelectedOptions={false}
                  getOptionLabel={(question) => question.text}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  limitTags={2}
                  multiple
                  onChange={(_, selectedQuestions) => setForm((current) => ({
                    ...current,
                    questionIds: selectedQuestions.map((question) => question.id),
                  }))}
                  options={approvedQuestionsForScope}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      helperText={`${form.questionIds.length} soru seçildi. Yalnızca onaylı sorular listelenir.`}
                      label="Sorular"
                      placeholder="Soru ara ve seç"
                    />
                  )}
                  renderOption={(props, question, state) => (
                    <Box component="li" {...props} key={question.id}>
                      <Checkbox checked={state.selected} sx={{ mr: 1 }} />
                      <Box>
                        <Typography sx={{ overflowWrap: 'anywhere' }}>{question.text}</Typography>
                        <Typography color="text.secondary" variant="caption">{getQuestionScopeLabel(question)}</Typography>
                      </Box>
                    </Box>
                  )}
                  value={approvedQuestionsForScope.filter((question) => form.questionIds.includes(question.id))}
                />
              )}
              <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1.25}>
            <Button disabled={isBusy} type="submit" variant="contained">{isBusy ? 'Kaydediliyor' : 'Kaydet'}</Button>
                <Button disabled={isBusy} onClick={() => setIsFormDrawerOpen(false)}>Vazgeç</Button>
              </Stack>
            </Stack>
        </Box>
      </AdminFormDrawer>
    </Stack>
  )
}
