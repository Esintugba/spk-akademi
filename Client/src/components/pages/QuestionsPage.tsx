import { FormEvent, useMemo, useState } from 'react'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import { Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, IconButton, InputAdornment, MenuItem, Stack, Switch, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from '@mui/material'
import { ContentAccessLevel, ExamSession, ExamType, QuestionDifficulty, QuestionType, ReviewStatus, TopicType, type CreateQuestionOption, type Question, type Topic } from '../../models'
import { api } from '../../shared/api'
import { AdminPageHero } from '../common/AdminPageHero'
import { AdminSurface } from '../common/AdminSurface'
import { EmptyState } from '../common/EmptyState'
import { ErrorBanner } from '../common/ErrorBanner'

interface QuestionsPageProps {
  questions: Question[]
  topics: Topic[]
  onChanged: () => Promise<void>
}

const defaultOptions: CreateQuestionOption[] = [
  { label: 'A', text: '', isCorrect: true },
  { label: 'B', text: '', isCorrect: false },
  { label: 'C', text: '', isCorrect: false },
  { label: 'D', text: '', isCorrect: false },
]

const minPastExamYear = 1990

export function QuestionsPage({ questions, topics, onChanged }: QuestionsPageProps) {
  const [topicId, setTopicId] = useState('')
  const [text, setText] = useState('')
  const [explanation, setExplanation] = useState('')
  const [sourceReference, setSourceReference] = useState('')
  const [sourceText, setSourceText] = useState('')
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>(QuestionDifficulty.Medium)
  const [type, setType] = useState<QuestionType>(QuestionType.Concept)
  const [isPastExamQuestion, setIsPastExamQuestion] = useState(false)
  const [examYear, setExamYear] = useState('')
  const [examType, setExamType] = useState<ExamType | ''>('')
  const [examSession, setExamSession] = useState<ExamSession | ''>('')
  const [options, setOptions] = useState<CreateQuestionOption[]>(defaultOptions)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [detailQuestion, setDetailQuestion] = useState<Question | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null)
  const [topicFilter, setTopicFilter] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState('')
  const [reviewStatusFilter, setReviewStatusFilter] = useState('')
  const [pastExamFilter, setPastExamFilter] = useState('')
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [busyId, setBusyId] = useState('')

  const filteredQuestions = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('tr-TR')

    return questions.filter((question) => {
      const topic = topics.find((item) => item.id === question.topicId)
      const matchesTopic = !topicFilter || question.topicId === topicFilter
      const matchesDifficulty = !difficultyFilter || question.difficulty === Number(difficultyFilter)
      const matchesReviewStatus = !reviewStatusFilter || question.reviewStatus === Number(reviewStatusFilter)
      const matchesPastExam =
        !pastExamFilter ||
        (pastExamFilter === 'past' && question.isPastExamQuestion) ||
        (pastExamFilter === 'standard' && !question.isPastExamQuestion)
      const matchesSearch =
        !term ||
        [
          question.text,
          question.explanation,
          question.sourceReference ?? '',
          topic?.title ?? '',
          question.examYear?.toString() ?? '',
          question.examType != null ? ExamType[question.examType] : '',
          question.examSession != null ? ExamSession[question.examSession] : '',
        ]
          .join(' ')
          .toLocaleLowerCase('tr-TR')
          .includes(term)

      return matchesTopic && matchesDifficulty && matchesReviewStatus && matchesPastExam && matchesSearch
    })
  }, [difficultyFilter, pastExamFilter, questions, reviewStatusFilter, search, topicFilter, topics])

  const subTopics = useMemo(
    () => topics.filter((topic) => topic.type === TopicType.SubTopic || topic.parentTopicId),
    [topics],
  )

  function getTopicTitle(id: string) {
    return topics.find((topic) => topic.id === id)?.title ?? 'Konu bulunamadı'
  }

  function getPastExamLabel(question: Question) {
    const parts: string[] = []
    if (question.examYear) parts.push(String(question.examYear))
    if (question.examType != null) parts.push(ExamType[question.examType])
    if (question.examSession != null) parts.push(ExamSession[question.examSession])
    return parts.join(' ') || 'Sınav bilgisi yok'
  }

  function updateOption(index: number, value: string) {
    setOptions((current) => current.map((option, optionIndex) => optionIndex === index ? { ...option, text: value } : option))
  }

  function markCorrect(index: number) {
    setOptions((current) => current.map((option, optionIndex) => ({ ...option, isCorrect: optionIndex === index })))
  }

  function resetForm() {
    setTopicId('')
    setText('')
    setExplanation('')
    setSourceReference('')
    setSourceText('')
    setDifficulty(QuestionDifficulty.Medium)
    setType(QuestionType.Concept)
    setIsPastExamQuestion(false)
    setExamYear('')
    setExamType('')
    setExamSession('')
    setOptions(defaultOptions)
    setEditingQuestion(null)
    setFieldError('')
  }

  function startEdit(question: Question) {
    setEditingQuestion(question)
    setTopicId(question.topicId)
    setText(question.text)
    setExplanation(question.explanation)
    setSourceReference(question.sourceReference ?? '')
    setSourceText(question.sourceText ?? '')
    setDifficulty(question.difficulty)
    setType(question.type)
    setIsPastExamQuestion(question.isPastExamQuestion)
    setExamYear(question.examYear?.toString() ?? '')
    setExamType(question.examType ?? '')
    setExamSession(question.examSession ?? '')
    setOptions(question.options.map((option) => ({ label: option.label, text: option.text, isCorrect: option.isCorrect })))
    setFieldError('')
  }

  function validateForm() {
    const currentYear = new Date().getUTCFullYear()
    const parsedExamYear = Number(examYear)

    if (!topicId) return 'Alt konu seçmelisin.'
    if (text.trim().length < 10) return 'Soru metni en az 10 karakter olmalı.'
    if (explanation.trim().length < 10) return 'Açıklama en az 10 karakter olmalı.'
    if (isPastExamQuestion && (!Number.isInteger(parsedExamYear) || parsedExamYear < minPastExamYear || parsedExamYear > currentYear)) {
      return `Çıkmış soru yılı ${minPastExamYear}-${currentYear} arasında olmalı.`
    }
    if (isPastExamQuestion && examType === '') return 'Çıkmış soru için sınav türü seçmelisin.'
    if (options.some((option) => option.text.trim().length < 1)) return 'Tüm şıklar doldurulmalı.'
    if (options.filter((option) => option.isCorrect).length !== 1) return 'Tam olarak bir doğru şık seçilmeli.'
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
    const parsedExamYear = Number(examYear)
    const selectedExamType = isPastExamQuestion && examType !== '' ? examType : null
    const selectedExamSession = isPastExamQuestion && examSession !== '' ? examSession : null
    const payload = {
      topicId,
      text: text.trim(),
      difficulty,
      type,
      explanation: explanation.trim(),
      isPastExamQuestion,
      examYear: isPastExamQuestion ? parsedExamYear : null,
      examType: selectedExamType,
      examSession: selectedExamSession,
      sourceReference: sourceReference.trim() || null,
      sourceText: sourceText.trim() || null,
      isAiGenerated: true,
      reviewStatus: ReviewStatus.PendingReview,
      accessLevel: editingQuestion?.accessLevel ?? ContentAccessLevel.Free,
      options: options.map((option) => ({ ...option, text: option.text.trim() })),
    }

    try {
      if (editingQuestion) await api.updateQuestion(editingQuestion.id, payload)
      else await api.createQuestion(payload)
      resetForm()
      await onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Soru kaydedilemedi.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setBusyId(deleteTarget.id)
    setError('')
    try {
      await api.deleteQuestion(deleteTarget.id)
      setDeleteTarget(null)
      await onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Soru silinemedi.')
    } finally {
      setBusyId('')
    }
  }

  return (
    <Stack spacing={3}>
      <AdminPageHero
        title="Soru bankasını moderasyon odaklı yönetin."
        description="Konu, zorluk, tip ve açıklama alanlarıyla zengin sorular üretin. Öğrenci tarafına yalnızca onaylı içerikler gittiği için burada kurduğunuz kalite standardı kritik."
        actions={<Button startIcon={<AddRoundedIcon />} variant="contained" onClick={resetForm}>Yeni soru</Button>}
      />
      {error && <ErrorBanner message={error} />}

      <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { lg: '0.95fr 1.05fr', xs: '1fr' } }}>
        <AdminSurface title={editingQuestion ? 'Soruyu düzenle' : 'Yeni soru ekle'}>
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              {fieldError && <ErrorBanner message={fieldError} />}
              <Stack direction={{ md: 'row', xs: 'column' }} spacing={2}>
                <TextField fullWidth label="Alt konu" required select value={topicId} onChange={(event) => setTopicId(event.target.value)}>
                  {subTopics.map((topic) => <MenuItem key={topic.id} value={topic.id}>{topic.parentTopicTitle ? `${topic.parentTopicTitle} > ${topic.title}` : topic.title}</MenuItem>)}
                </TextField>
                <TextField fullWidth label="Zorluk" select value={difficulty} onChange={(event) => setDifficulty(Number(event.target.value) as QuestionDifficulty)}>
                  <MenuItem value={QuestionDifficulty.Easy}>Kolay</MenuItem>
                  <MenuItem value={QuestionDifficulty.Medium}>Orta</MenuItem>
                  <MenuItem value={QuestionDifficulty.Hard}>Zor</MenuItem>
                </TextField>
                <TextField fullWidth label="Tip" select value={type} onChange={(event) => setType(Number(event.target.value) as QuestionType)}>
                  <MenuItem value={QuestionType.Definition}>Tanım</MenuItem>
                  <MenuItem value={QuestionType.Concept}>Kavram</MenuItem>
                  <MenuItem value={QuestionType.Legislation}>Mevzuat</MenuItem>
                  <MenuItem value={QuestionType.Formula}>Formül</MenuItem>
                  <MenuItem value={QuestionType.Comparison}>Karşılaştırma</MenuItem>
                  <MenuItem value={QuestionType.Interpretation}>Yorum</MenuItem>
                </TextField>
              </Stack>
              <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 2 }}>
                <Stack spacing={2}>
                  <FormControlLabel
                    control={<Switch checked={isPastExamQuestion} onChange={(event) => setIsPastExamQuestion(event.target.checked)} />}
                    label="Çıkmış soru"
                  />
                  {isPastExamQuestion && (
                    <Stack direction={{ md: 'row', xs: 'column' }} spacing={2}>
                      <TextField
                        fullWidth
                        label="Sınav yılı"
                        required
                        value={examYear}
                        onChange={(event) => setExamYear(onlyDigits(event.target.value))}
                        slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 4, pattern: '[0-9]*' } }}
                      />
                      <TextField
                        fullWidth
                        label="Sınav türü"
                        required
                        select
                        value={examType}
                        onChange={(event) => setExamType(Number(event.target.value) as ExamType)}
                      >
                        {Object.values(ExamType).filter((value) => typeof value === 'number').map((value) => (
                          <MenuItem key={value} value={value}>{ExamType[value as ExamType]}</MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        fullWidth
                        label="Oturum"
                        select
                        value={examSession}
                        onChange={(event) => setExamSession(event.target.value === '' ? '' : Number(event.target.value) as ExamSession)}
                      >
                        <MenuItem value="">Opsiyonel</MenuItem>
                        {Object.values(ExamSession).filter((value) => typeof value === 'number').map((value) => (
                          <MenuItem key={value} value={value}>{ExamSession[value as ExamSession]}</MenuItem>
                        ))}
                      </TextField>
                    </Stack>
                  )}
                </Stack>
              </Box>
              <TextField fullWidth label="Soru metni" rows={4} multiline required value={text} onChange={(event) => setText(event.target.value)} />
              <Stack spacing={1.5}>
                {options.map((option, index) => (
                  <Stack direction={{ sm: 'row', xs: 'column' }} key={option.label} spacing={1.5} sx={{ alignItems: 'center' }}>
                    <TextField fullWidth label={`${option.label} şıkkı`} required value={option.text} onChange={(event) => updateOption(index, event.target.value)} />
                    <ToggleButtonGroup exclusive size="small" value={option.isCorrect ? option.label : ''}>
                      <ToggleButton value={option.label} onClick={() => markCorrect(index)}>Doğru</ToggleButton>
                    </ToggleButtonGroup>
                  </Stack>
                ))}
              </Stack>
              <TextField fullWidth label="Açıklama" rows={3} multiline required value={explanation} onChange={(event) => setExplanation(event.target.value)} />
              <TextField fullWidth label="Kaynak referansı" value={sourceReference} onChange={(event) => setSourceReference(event.target.value)} />
              <TextField fullWidth label="Kaynak metin" rows={3} multiline value={sourceText} onChange={(event) => setSourceText(event.target.value)} />
              <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1.25}>
                <Button disabled={isSaving || subTopics.length === 0} type="submit" variant="contained">{isSaving ? 'Kaydediliyor' : editingQuestion ? 'Değişiklikleri kaydet' : 'Soru ekle'}</Button>
                {editingQuestion && <Button onClick={resetForm}>Vazgeç</Button>}
              </Stack>
            </Stack>
          </Box>
        </AdminSurface>

        <AdminSurface title="Soru listesi">
          <Stack spacing={2}>
            <Stack direction={{ md: 'row', xs: 'column' }} spacing={2}>
              <TextField fullWidth label="Soru ara" value={search} onChange={(event) => setSearch(event.target.value)} slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> } }} />
              <TextField fullWidth label="Konu filtresi" select value={topicFilter} onChange={(event) => setTopicFilter(event.target.value)}>
                <MenuItem value="">Tümü</MenuItem>
                {topics.map((topic) => <MenuItem key={topic.id} value={topic.id}>{topic.parentTopicId ? `  - ${topic.title}` : topic.title}</MenuItem>)}
              </TextField>
            </Stack>
            <Stack direction={{ md: 'row', xs: 'column' }} spacing={2}>
              <TextField fullWidth label="Zorluk filtresi" select value={difficultyFilter} onChange={(event) => setDifficultyFilter(event.target.value)}>
                <MenuItem value="">Tümü</MenuItem>
                <MenuItem value={QuestionDifficulty.Easy}>Kolay</MenuItem>
                <MenuItem value={QuestionDifficulty.Medium}>Orta</MenuItem>
                <MenuItem value={QuestionDifficulty.Hard}>Zor</MenuItem>
              </TextField>
              <TextField fullWidth label="Onay durumu" select value={reviewStatusFilter} onChange={(event) => setReviewStatusFilter(event.target.value)}>
                <MenuItem value="">Tümü</MenuItem>
                <MenuItem value={ReviewStatus.Draft}>Draft</MenuItem>
                <MenuItem value={ReviewStatus.PendingReview}>Pending</MenuItem>
                <MenuItem value={ReviewStatus.Approved}>Approved</MenuItem>
                <MenuItem value={ReviewStatus.Rejected}>Rejected</MenuItem>
              </TextField>
              <TextField fullWidth label="Soru kaynağı" select value={pastExamFilter} onChange={(event) => setPastExamFilter(event.target.value)}>
                <MenuItem value="">Tümü</MenuItem>
                <MenuItem value="past">Çıkmış sorular</MenuItem>
                <MenuItem value="standard">Standart sorular</MenuItem>
              </TextField>
            </Stack>

            <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { md: 'repeat(2, minmax(0, 1fr))', xs: '1fr' } }}>
              {filteredQuestions.length === 0 ? (
                <EmptyState title="Soru yok" description="Filtreleri temizleyebilir veya soru ekleyebilirsin." />
              ) : (
                filteredQuestions.map((question) => (
                  <Card key={question.id} sx={{ borderRadius: 3, minWidth: 0, overflow: 'hidden' }} variant="outlined">
                    <CardContent sx={{ minWidth: 0 }}>
                      <Stack direction="row" sx={{ alignItems: 'flex-start', gap: 1, justifyContent: 'space-between', minWidth: 0 }}>
                        <Stack direction="row" spacing={1} sx={{ flex: '1 1 auto', flexWrap: 'wrap', gap: 1, minWidth: 0, '& .MuiChip-root': { maxWidth: '100%' }, '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' } }}>
                          <Chip color="primary" label={`${question.options.length} şık`} size="small" />
                          <Chip label={getTopicTitle(question.topicId)} size="small" />
                          {question.isPastExamQuestion && <Chip color="warning" label="Çıkmış Soru" size="small" />}
                          {question.isPastExamQuestion && <Chip label={getPastExamLabel(question)} size="small" variant="outlined" />}
                        </Stack>
                        <Stack direction="row" spacing={0.5} sx={{ flex: '0 0 auto', flexWrap: 'nowrap' }}>
                          <Tooltip title="Detay"><IconButton size="small" sx={{ flexShrink: 0 }} onClick={() => setDetailQuestion(question)}><InfoOutlinedIcon /></IconButton></Tooltip>
                          <Tooltip title="Düzenle"><IconButton size="small" sx={{ flexShrink: 0 }} onClick={() => startEdit(question)}><EditOutlinedIcon /></IconButton></Tooltip>
                          <Tooltip title="Sil"><IconButton size="small" sx={{ flexShrink: 0 }} color="error" disabled={busyId === question.id} onClick={() => setDeleteTarget(question)}><DeleteOutlineIcon /></IconButton></Tooltip>
                        </Stack>
                      </Stack>
                      <Typography sx={{ fontSize: 18, fontWeight: 900, mt: 1.5, overflowWrap: 'anywhere' }}>{question.text}</Typography>
                      <Typography color="text.secondary" sx={{ mt: 1, overflowWrap: 'anywhere' }}>{question.explanation}</Typography>
                      <Typography color="text.secondary" sx={{ mt: 2 }} variant="body2">{question.sourceReference || 'Kaynak belirtilmedi'}</Typography>
                    </CardContent>
                  </Card>
                ))
              )}
            </Box>
          </Stack>
        </AdminSurface>
      </Box>

      <Dialog open={Boolean(detailQuestion)} onClose={() => setDetailQuestion(null)} maxWidth="md" fullWidth>
        <DialogTitle>Soru detayı</DialogTitle>
        <DialogContent>
          {detailQuestion && (
            <Stack spacing={1.5}>
              <Typography><strong>Konu:</strong> {getTopicTitle(detailQuestion.topicId)}</Typography>
              {detailQuestion.isPastExamQuestion && <Typography><strong>Çıkmış soru:</strong> {getPastExamLabel(detailQuestion)}</Typography>}
              <Typography sx={{ whiteSpace: 'pre-wrap' }}>{detailQuestion.text}</Typography>
              <Stack spacing={1}>
                {detailQuestion.options.map((option) => (
                  <Typography key={option.id} color={option.isCorrect ? 'success.main' : 'text.primary'}>
                    {option.label}) {option.text}{option.isCorrect ? ' · doğru' : ''}
                  </Typography>
                ))}
              </Stack>
              <Typography><strong>Açıklama:</strong> {detailQuestion.explanation}</Typography>
              <Typography><strong>Kaynak:</strong> {detailQuestion.sourceReference || 'Yok'}</Typography>
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Soru silinsin mi?</DialogTitle>
        <DialogContent><Typography>Bu soru kalıcı olarak silinecek.</Typography></DialogContent>
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
