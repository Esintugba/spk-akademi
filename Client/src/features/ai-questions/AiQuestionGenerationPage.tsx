import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import PublishOutlinedIcon from '@mui/icons-material/PublishOutlined'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import {
  AiQuestionDraftStatus,
  AiQuestionGenerationJobStatus,
  QuestionDifficulty,
  type AiQuestionDraft,
  type CreateAiQuestionGenerationJob,
  type UpdateAiQuestionDraft,
} from '../../models'
import {
  aiQuestionGenerationApi,
  sourceDocumentsApi,
  topicsApi,
} from '../../shared/api'

const difficultyLabels: Record<QuestionDifficulty, string> = {
  [QuestionDifficulty.Easy]: 'Kolay',
  [QuestionDifficulty.Medium]: 'Orta',
  [QuestionDifficulty.Hard]: 'Zor',
}

export function AiQuestionGenerationPage() {
  const queryClient = useQueryClient()
  const [sourceDocumentId, setSourceDocumentId] = useState('')
  const [topicId, setTopicId] = useState('')
  const [startPage, setStartPage] = useState(1)
  const [endPage, setEndPage] = useState(1)
  const [easyCount, setEasyCount] = useState(0)
  const [mediumCount, setMediumCount] = useState(5)
  const [hardCount, setHardCount] = useState(0)
  const [includeExplanations, setIncludeExplanations] = useState(true)
  const [jobId, setJobId] = useState<string | null>(null)
  const [selectedDraftIds, setSelectedDraftIds] = useState<Set<string>>(new Set())
  const [editingDraft, setEditingDraft] = useState<AiQuestionDraft | null>(null)

  const sourceDocumentsQuery = useQuery({
    queryKey: ['source-documents', 'ai-question-generation'],
    queryFn: () => sourceDocumentsApi.getAll(),
  })
  const jobsQuery = useQuery({
    queryKey: ['ai-question-generation-jobs'],
    queryFn: () => aiQuestionGenerationApi.getJobs(),
  })
  const selectedSource = sourceDocumentsQuery.data?.find((item) => item.id === sourceDocumentId)
  const topicsQuery = useQuery({
    queryKey: ['topics', 'ai-question-generation', selectedSource?.courseId],
    queryFn: () => topicsApi.getAll(selectedSource!.courseId),
    enabled: !!selectedSource,
  })

  useEffect(() => {
    if (!selectedSource) return
    setEndPage(Math.max(1, selectedSource.pageCount))
    setTopicId('')
  }, [selectedSource])

  const createMutation = useMutation({
    mutationFn: (payload: CreateAiQuestionGenerationJob) => aiQuestionGenerationApi.createJob(payload),
    onSuccess: (job) => {
      setJobId(job.id)
      setSelectedDraftIds(new Set())
      void queryClient.invalidateQueries({ queryKey: ['ai-question-generation-jobs'] })
      toast.success('Soru üretim işi başlatıldı.')
    },
    onError: (error: Error) => toast.error(error.message || 'Soru üretimi başlatılamadı.'),
  })

  const jobQuery = useQuery({
    queryKey: ['ai-question-generation-job', jobId],
    queryFn: () => aiQuestionGenerationApi.getJob(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === AiQuestionGenerationJobStatus.Pending ||
        status === AiQuestionGenerationJobStatus.Processing
        ? 2000
        : false
    },
  })

  const draftsQuery = useQuery({
    queryKey: ['ai-question-drafts', jobId],
    queryFn: () => aiQuestionGenerationApi.getDrafts(jobId!),
    enabled: !!jobId && jobQuery.data?.status === AiQuestionGenerationJobStatus.Completed,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAiQuestionDraft }) =>
      aiQuestionGenerationApi.updateDraft(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['ai-question-drafts', jobId] })
      setEditingDraft(null)
      toast.success('Taslak güncellendi.')
    },
    onError: (error: Error) => toast.error(error.message || 'Taslak güncellenemedi.'),
  })

  const publishMutation = useMutation({
    mutationFn: () => aiQuestionGenerationApi.publishDrafts(jobId!, [...selectedDraftIds]),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ['ai-question-drafts', jobId] })
      setSelectedDraftIds(new Set())
      toast.success(`${result.publishedCount} soru inceleme kuyruğuna aktarıldı.`)
    },
    onError: (error: Error) => toast.error(error.message || 'Sorular aktarılamadı.'),
  })

  const availableDrafts = useMemo(
    () => (draftsQuery.data ?? []).filter((draft) => draft.status !== AiQuestionDraftStatus.Published),
    [draftsQuery.data],
  )
  const totalRequested = easyCount + mediumCount + hardCount

  function startGeneration() {
    if (!sourceDocumentId || !topicId || totalRequested < 1 || totalRequested > 50) {
      toast.error('PDF, konu ve 1–50 arasında soru dağılımı seçin.')
      return
    }

    createMutation.mutate({
      sourceDocumentId,
      topicId,
      startPage,
      endPage,
      easyQuestionCount: easyCount,
      mediumQuestionCount: mediumCount,
      hardQuestionCount: hardCount,
      includeExplanations,
    })
  }

  function toggleDraft(id: string) {
    setSelectedDraftIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography sx={{ fontWeight: 900 }} variant="h4">PDF’den AI soru üretimi</Typography>
        <Typography color="text.secondary">
          Sorular yalnızca seçilen PDF sayfalarından taslak olarak üretilir; admin incelemeden soru havuzuna aktarılmaz.
        </Typography>
      </Box>

      <Alert severity="warning">
        Yapay zekâ çıktısını kaynak sayfa ve alıntıyla karşılaştırmadan yayımlamayın.
      </Alert>

      {(jobsQuery.data?.length ?? 0) > 0 && (
        <TextField
          fullWidth
          label="Son üretim işleri"
          onChange={(event) => {
            setJobId(event.target.value)
            setSelectedDraftIds(new Set())
          }}
          select
          value={jobId ?? ''}
        >
          {(jobsQuery.data ?? []).map((job) => (
            <MenuItem key={job.id} value={job.id}>
              {new Date(job.createdAt).toLocaleString('tr-TR')} · {job.sourceDocumentTitle} · {job.topicTitle}
            </MenuItem>
          ))}
        </TextField>
      )}

      <Paper sx={{ borderRadius: 3, p: 2.5 }} variant="outlined">
        <Stack spacing={2}>
          <TextField
            fullWidth
            label="Kaynak PDF"
            onChange={(event) => setSourceDocumentId(event.target.value)}
            select
            value={sourceDocumentId}
          >
            {(sourceDocumentsQuery.data ?? []).map((document) => (
              <MenuItem
                disabled={!document.textExtractedAt}
                key={document.id}
                value={document.id}
              >
                {document.title} · {document.pageCount} sayfa
                {!document.textExtractedAt ? ' · metin çıkarılmamış' : ''}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            disabled={!selectedSource || topicsQuery.isLoading}
            fullWidth
            label="Konu"
            onChange={(event) => setTopicId(event.target.value)}
            select
            value={topicId}
          >
            {(topicsQuery.data ?? []).map((topic) => (
              <MenuItem key={topic.id} value={topic.id}>{topic.title}</MenuItem>
            ))}
          </TextField>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { md: 'repeat(5, 1fr)', xs: '1fr 1fr' } }}>
            <NumberField label="Başlangıç sayfası" min={1} onChange={setStartPage} value={startPage} />
            <NumberField label="Bitiş sayfası" min={startPage} onChange={setEndPage} value={endPage} />
            <NumberField label="Kolay" min={0} onChange={setEasyCount} value={easyCount} />
            <NumberField label="Orta" min={0} onChange={setMediumCount} value={mediumCount} />
            <NumberField label="Zor" min={0} onChange={setHardCount} value={hardCount} />
          </Box>

          <FormControlLabel
            control={(
              <Checkbox
                checked={includeExplanations}
                onChange={(event) => setIncludeExplanations(event.target.checked)}
              />
            )}
            label="Açıklamalı çözüm üret"
          />

          <Button
            disabled={createMutation.isPending || !sourceDocumentId || !topicId}
            onClick={startGeneration}
            startIcon={<AutoAwesomeOutlinedIcon />}
            variant="contained"
          >
            {totalRequested} taslak soru üret
          </Button>
        </Stack>
      </Paper>

      {jobQuery.data && (
        <Paper sx={{ borderRadius: 3, p: 2.5 }} variant="outlined">
          <Stack spacing={1.5}>
            <Typography sx={{ fontWeight: 800 }}>
              {jobQuery.data.sourceDocumentTitle} · {jobQuery.data.topicTitle}
            </Typography>
            {(jobQuery.data.status === AiQuestionGenerationJobStatus.Pending ||
              jobQuery.data.status === AiQuestionGenerationJobStatus.Processing) && (
              <>
                <LinearProgress />
                <Typography color="text.secondary">Sorular güvenli biçimde hazırlanıyor…</Typography>
              </>
            )}
            {jobQuery.data.status === AiQuestionGenerationJobStatus.Failed && (
              <Alert severity="error">{jobQuery.data.errorMessage || 'Üretim işi başarısız oldu.'}</Alert>
            )}
            {jobQuery.data.status === AiQuestionGenerationJobStatus.Completed && (
              <Alert severity="success">
                {jobQuery.data.generatedQuestionCount} taslak üretildi. Kaynakları kontrol edip seçtiklerinizi aktarın.
              </Alert>
            )}
          </Stack>
        </Paper>
      )}

      {availableDrafts.length > 0 && (
        <Stack spacing={2}>
          <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1}>
            <Button
              onClick={() => setSelectedDraftIds(new Set(availableDrafts.map((draft) => draft.id)))}
              variant="outlined"
            >
              Tümünü seç
            </Button>
            <Button onClick={() => setSelectedDraftIds(new Set())} variant="text">Seçimi temizle</Button>
            <Button
              disabled={selectedDraftIds.size === 0 || publishMutation.isPending}
              onClick={() => publishMutation.mutate()}
              startIcon={<PublishOutlinedIcon />}
              variant="contained"
            >
              Seçilen {selectedDraftIds.size} soruyu inceleme kuyruğuna aktar
            </Button>
          </Stack>

          {availableDrafts.map((draft) => (
            <Paper key={draft.id} sx={{ borderRadius: 3, p: 2 }} variant="outlined">
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                  <Checkbox
                    checked={selectedDraftIds.has(draft.id)}
                    onChange={() => toggleDraft(draft.id)}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 800 }}>{draft.questionText}</Typography>
                    <Typography color="text.secondary" variant="body2">
                      Sayfa {draft.sourcePage} · {difficultyLabels[draft.difficulty]}
                    </Typography>
                  </Box>
                  <Button
                    onClick={() => setEditingDraft(draft)}
                    startIcon={<EditOutlinedIcon />}
                    variant="outlined"
                  >
                    Düzenle
                  </Button>
                </Stack>
                <Stack spacing={0.5}>
                  {optionEntries(draft).map(([label, value]) => (
                    value && (
                      <Typography
                        color={draft.correctOption === label ? 'success.main' : 'text.primary'}
                        key={label}
                        variant="body2"
                      >
                        <strong>{label})</strong> {value}
                      </Typography>
                    )
                  ))}
                </Stack>
                {draft.explanation && <Typography variant="body2"><strong>Açıklama:</strong> {draft.explanation}</Typography>}
                <Alert severity="info">
                  <strong>Kaynak:</strong> “{draft.sourceExcerpt}”
                </Alert>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      <DraftEditDialog
        draft={editingDraft}
        isSaving={updateMutation.isPending}
        onClose={() => setEditingDraft(null)}
        onSave={(payload) => editingDraft && updateMutation.mutate({ id: editingDraft.id, payload })}
      />
    </Stack>
  )
}

function NumberField({
  label,
  min,
  onChange,
  value,
}: {
  label: string
  min: number
  onChange: (value: number) => void
  value: number
}) {
  return (
    <TextField
      slotProps={{ htmlInput: { min } }}
      label={label}
      onChange={(event) => onChange(Number(event.target.value))}
      type="number"
      value={value}
    />
  )
}

function optionEntries(draft: AiQuestionDraft): Array<[string, string | null]> {
  return [
    ['A', draft.optionA],
    ['B', draft.optionB],
    ['C', draft.optionC],
    ['D', draft.optionD],
    ['E', draft.optionE],
  ]
}

function DraftEditDialog({
  draft,
  isSaving,
  onClose,
  onSave,
}: {
  draft: AiQuestionDraft | null
  isSaving: boolean
  onClose: () => void
  onSave: (payload: UpdateAiQuestionDraft) => void
}) {
  const [form, setForm] = useState<UpdateAiQuestionDraft | null>(null)

  useEffect(() => {
    if (!draft) {
      setForm(null)
      return
    }
    setForm({
      questionText: draft.questionText,
      optionA: draft.optionA,
      optionB: draft.optionB,
      optionC: draft.optionC,
      optionD: draft.optionD,
      optionE: draft.optionE,
      correctOption: draft.correctOption,
      explanation: draft.explanation,
      difficulty: draft.difficulty,
      sourcePage: draft.sourcePage,
      sourceExcerpt: draft.sourceExcerpt,
    })
  }, [draft])

  if (!form) return null
  const set = <K extends keyof UpdateAiQuestionDraft>(key: K, value: UpdateAiQuestionDraft[K]) =>
    setForm((current) => current ? { ...current, [key]: value } : current)

  return (
    <Dialog fullWidth maxWidth="md" onClose={onClose} open={!!draft}>
      <DialogTitle>Taslak soruyu düzenle</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Soru"
            multiline
            onChange={(event) => set('questionText', event.target.value)}
            rows={3}
            value={form.questionText}
          />
          {(['A', 'B', 'C', 'D', 'E'] as const).map((label) => {
            const key = `option${label}` as keyof UpdateAiQuestionDraft
            return (
              <TextField
                key={label}
                label={`Seçenek ${label}`}
                onChange={(event) => set(key, event.target.value as never)}
                value={String(form[key] ?? '')}
              />
            )
          })}
          <Stack direction={{ sm: 'row', xs: 'column' }} spacing={2}>
            <TextField
              fullWidth
              label="Doğru seçenek"
              onChange={(event) => set('correctOption', event.target.value)}
              select
              value={form.correctOption}
            >
              {['A', 'B', 'C', 'D', 'E'].map((label) => <MenuItem key={label} value={label}>{label}</MenuItem>)}
            </TextField>
            <TextField
              fullWidth
              label="Zorluk"
              onChange={(event) => set('difficulty', Number(event.target.value) as QuestionDifficulty)}
              select
              value={form.difficulty}
            >
              {Object.entries(difficultyLabels).map(([value, label]) => (
                <MenuItem key={value} value={Number(value)}>{label}</MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="Kaynak sayfa"
              onChange={(event) => set('sourcePage', Number(event.target.value))}
              type="number"
              value={form.sourcePage}
            />
          </Stack>
          <TextField
            label="Açıklama"
            multiline
            onChange={(event) => set('explanation', event.target.value)}
            rows={3}
            value={form.explanation}
          />
          <TextField
            helperText="Bu metin PDF içinde birebir veya yalnızca boşluk farklarıyla bulunmalıdır."
            label="Kaynak alıntı"
            multiline
            onChange={(event) => set('sourceExcerpt', event.target.value)}
            rows={3}
            value={form.sourceExcerpt}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button disabled={isSaving} onClick={onClose}>Vazgeç</Button>
        <Button disabled={isSaving} onClick={() => onSave(form)} variant="contained">Kaydet</Button>
      </DialogActions>
    </Dialog>
  )
}
