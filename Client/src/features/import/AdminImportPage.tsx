import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined'
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  Chip,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { DuplicateImportAction, DuplicateMatchType, ImportJobStatus, type DuplicateImportDecision, type ImportPreview, type MaterialImportResult } from '../../models/import'
import { coursesApi, importApi } from '../../shared/api'

type ImportMode = 'questions' | 'materials'

const statusLabels: Record<ImportJobStatus, string> = {
  [ImportJobStatus.Pending]: 'Bekliyor',
  [ImportJobStatus.Processing]: 'İşleniyor',
  [ImportJobStatus.Completed]: 'Tamamlandı',
  [ImportJobStatus.Failed]: 'Başarısız',
  [ImportJobStatus.PartiallyCompleted]: 'İsmen tamamlandı',
}

const duplicateLabels: Record<DuplicateMatchType, string> = {
  [DuplicateMatchType.Exact]: 'Exact',
  [DuplicateMatchType.Similar]: 'Similar',
  [DuplicateMatchType.PossibleDuplicate]: 'Possible',
}

const duplicateActionLabels: Record<DuplicateImportAction, string> = {
  [DuplicateImportAction.Skip]: 'Skip',
  [DuplicateImportAction.Overwrite]: 'Overwrite',
  [DuplicateImportAction.CreateNew]: 'Create new',
}

export function AdminImportPage() {
  const [importMode, setImportMode] = useState<ImportMode>('questions')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const [duplicateDecisionsByRow, setDuplicateDecisionsByRow] = useState<Record<number, DuplicateImportDecision>>({})
  const [materialCourseId, setMaterialCourseId] = useState('')
  const [materialTitle, setMaterialTitle] = useState('')
  const [materialSourceName, setMaterialSourceName] = useState('Bulk import')
  const [materialFile, setMaterialFile] = useState<File | null>(null)
  const [materialResult, setMaterialResult] = useState<MaterialImportResult | null>(null)

  const canStartImport = !!file && !!preview && preview.invalidRows === 0
  const duplicateDecisions = useMemo(
    () => buildDuplicateDecisions(preview?.duplicates ?? [], duplicateDecisionsByRow),
    [duplicateDecisionsByRow, preview?.duplicates],
  )

  const coursesQuery = useQuery({
    queryKey: ['courses', 'admin-import'],
    queryFn: () => coursesApi.getAll(),
  })

  const previewMutation = useMutation({
    mutationFn: importApi.previewQuestions,
    onSuccess: (data) => {
      setPreview(data)
      setDuplicateDecisionsByRow({})
      toast.success('Import preview hazırlandı.')
    },
    onError: (error: Error) => toast.error(error.message || 'Preview oluşturulamadı.'),
  })

  const importMutation = useMutation({
    mutationFn: ({ nextFile, decisions }: { nextFile: File; decisions: DuplicateImportDecision[] }) =>
      importApi.importQuestions(nextFile, decisions),
    onSuccess: (job) => {
      setJobId(job.id)
      toast.success('Import job başlatıldı.')
    },
    onError: (error: Error) => toast.error(error.message || 'Import başlatılamadı.'),
  })

  const duplicateCheckMutation = useMutation({
    mutationFn: importApi.duplicateCheck,
    onSuccess: (data) => {
      setPreview(data)
      setDuplicateDecisionsByRow({})
      toast.success('Duplicate kontrolü yenilendi.')
    },
    onError: (error: Error) => toast.error(error.message || 'Duplicate kontrolü yenilenemedi.'),
  })

  const materialImportMutation = useMutation({
    mutationFn: importApi.importMaterials,
    onSuccess: (result) => {
      setMaterialResult(result)
      toast.success(`${result.importedFiles} materyal import edildi.`)
    },
    onError: (error: Error) => toast.error(error.message || 'Materyal import başlatılamadı.'),
  })

  const jobQuery = useQuery({
    queryKey: ['import-job', jobId],
    queryFn: () => importApi.getJob(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === ImportJobStatus.Pending || status === ImportJobStatus.Processing ? 2000 : false
    },
  })

  const progress = useMemo(() => {
    const job = jobQuery.data
    if (!job || job.totalRows === 0) {
      return 0
    }

    return Math.round(((job.successfulRows + job.failedRows) / job.totalRows) * 100)
  }, [jobQuery.data])

  function handleFile(nextFile: File | undefined) {
    if (!nextFile) {
      return
    }

    setFile(nextFile)
    setPreview(null)
    setJobId(null)
    setDuplicateDecisionsByRow({})
  }

  function setDuplicateAction(duplicate: ImportPreview['duplicates'][number], action: DuplicateImportAction) {
    if (duplicate.rowNumber == null) {
      return
    }

    setDuplicateDecisionsByRow((current) => ({
      ...current,
      [duplicate.rowNumber as number]: {
        rowNumber: duplicate.rowNumber as number,
        matchedQuestionId: duplicate.matchedQuestionId,
        action,
      },
    }))
  }

  function handleMaterialFile(nextFile: File | undefined) {
    if (!nextFile) {
      return
    }

    setMaterialFile(nextFile)
    setMaterialResult(null)
    if (!materialTitle && nextFile.name.toLocaleLowerCase('tr-TR').endsWith('.pdf')) {
      setMaterialTitle(nextFile.name.replace(/\.[^.]+$/, ''))
    }
  }

  function startMaterialImport() {
    if (!materialCourseId || !materialFile) {
      toast.error('Ders ve PDF/ZIP dosyası seçmelisin.')
      return
    }

    materialImportMutation.mutate({
      courseId: materialCourseId,
      title: materialTitle,
      sourceName: materialSourceName,
      file: materialFile,
    })
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography sx={{ fontWeight: 900 }} variant="h4">
          Toplu import
        </Typography>
        <Typography color="text.secondary">
          CSV veya JSON soru dosyasını yükleyin, önce doğrulama ve benzer kayıt ön izlemesini alın, ardından içe aktarma işlemini başlatın.
        </Typography>
      </Box>

      <Paper sx={{ borderRadius: 2 }} variant="outlined">
        <Tabs
          onChange={(_, value: ImportMode) => setImportMode(value)}
          value={importMode}
          variant="fullWidth"
        >
          <Tab label="Soru import" value="questions" />
          <Tab label="Materyal import" value="materials" />
        </Tabs>
      </Paper>

      {importMode === 'questions' && (
        <>
      <Paper
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault()
          handleFile(event.dataTransfer.files[0])
        }}
        sx={{
          alignItems: 'center',
          border: '1px dashed rgba(37,99,235,0.45)',
          borderRadius: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          p: 4,
          textAlign: 'center',
        }}
        variant="outlined"
      >
        <CloudUploadOutlinedIcon color="primary" sx={{ fontSize: 44 }} />
        <Typography sx={{ fontWeight: 800 }}>{file ? file.name : 'Dosyayı buraya sürükleyin veya seçin'}</Typography>
        <Typography color="text.secondary" variant="body2">
          Desteklenen formatlar: CSV, JSON. Maksimum 10 MB.
        </Typography>
        <Button component="label" variant="outlined">
          Dosya seç
          <input
            accept=".csv,.json,.xlsx"
            hidden
            onChange={(event) => handleFile(event.target.files?.[0])}
            type="file"
          />
        </Button>
      </Paper>

      <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1.5}>
        <Button
          disabled={!file || previewMutation.isPending}
          onClick={() => file && previewMutation.mutate(file)}
          startIcon={<SearchOutlinedIcon />}
          variant="contained"
        >
          Preview Import
        </Button>
        <Button
          disabled={!canStartImport || importMutation.isPending}
          onClick={() => file && importMutation.mutate({ nextFile: file, decisions: duplicateDecisions })}
          startIcon={<PlayArrowOutlinedIcon />}
          variant="outlined"
        >
          Importu Başlat
        </Button>
        <Button
          disabled={!preview?.rows.length || duplicateCheckMutation.isPending}
          onClick={() => preview?.rows && duplicateCheckMutation.mutate(preview.rows)}
          startIcon={<SearchOutlinedIcon />}
          variant="text"
        >
          Duplicate Tekrar Kontrol Et
        </Button>
      </Stack>

      {(previewMutation.isPending || importMutation.isPending || duplicateCheckMutation.isPending) && <LinearProgress />}

      {preview && (
        <Stack spacing={2}>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { md: 'repeat(4, 1fr)', xs: 'repeat(2, 1fr)' } }}>
            <Metric label="Toplam" value={preview.totalRows} />
            <Metric label="Valid" value={preview.validRows} />
            <Metric label="Invalid" value={preview.invalidRows} />
            <Metric label="Duplicate" value={preview.duplicateRows} />
          </Box>

          {preview.duplicates.length > 0 && (
            <Alert severity="info">
              Duplicate satırlar varsayılan olarak importta atlanır. Create new seçilenler yeni soru olarak eklenir; Overwrite seçilenler eşleşen mevcut soruyu günceller.
            </Alert>
          )}

          {(preview.missingCourses.length > 0 || preview.missingTopics.length > 0) && (
            <Alert severity="warning">
              Eksik dersler: {preview.missingCourses.join(', ') || '-'} | Eksik konular: {preview.missingTopics.join(', ') || '-'}
            </Alert>
          )}

          <ErrorTable errors={preview.errors} />
          <DuplicateTable
            decisions={duplicateDecisionsByRow}
            duplicates={preview.duplicates}
            onActionChange={setDuplicateAction}
          />
        </Stack>
      )}

      {jobQuery.data && (
        <Paper sx={{ borderRadius: 3, p: 2.5 }} variant="outlined">
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Typography sx={{ fontWeight: 900 }}>Import job</Typography>
              <Chip label={statusLabels[jobQuery.data.status]} size="small" />
            </Stack>
            <LinearProgress value={progress} variant="determinate" />
            <Typography color="text.secondary" variant="body2">
              Başarılı: {jobQuery.data.successfulRows} | Hatalı: {jobQuery.data.failedRows} | Toplam: {jobQuery.data.totalRows}
            </Typography>
            {jobQuery.data.errors.length > 0 && <ErrorTable errors={jobQuery.data.errors} />}
          </Stack>
        </Paper>
      )}
        </>
      )}

      {importMode === 'materials' && (
        <Stack spacing={2}>
          <Paper
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault()
              handleMaterialFile(event.dataTransfer.files[0])
            }}
            sx={{
              alignItems: 'center',
              border: '1px dashed rgba(37,99,235,0.45)',
              borderRadius: 3,
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              p: 4,
              textAlign: 'center',
            }}
            variant="outlined"
          >
            <CloudUploadOutlinedIcon color="primary" sx={{ fontSize: 44 }} />
            <Typography sx={{ fontWeight: 800 }}>
              {materialFile ? materialFile.name : 'PDF veya ZİP dosyasını buraya sürükleyin'}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              PDF tek kaynak olarak, ZİP ise içindeki PDF dosyaları toplu kaynak olarak import edilir. Maksimum 50 MB.
            </Typography>
            <Button component="label" variant="outlined">
              PDF/ZİP seç
              <input
                accept=".pdf,.zip,application/pdf,application/zip"
                hidden
                onChange={(event) => handleMaterialFile(event.target.files?.[0])}
                type="file"
              />
            </Button>
          </Paper>

          <Paper sx={{ borderRadius: 3, p: 2.5 }} variant="outlined">
            <Stack spacing={2}>
              {coursesQuery.isError && <Alert severity="error">Ders listesi yüklenemedi.</Alert>}
              <TextField
                disabled={coursesQuery.isLoading}
                fullWidth
                label="Ders"
                onChange={(event) => setMaterialCourseId(event.target.value)}
                required
                select
                value={materialCourseId}
              >
                {(coursesQuery.data ?? []).map((course) => (
                  <MenuItem key={course.id} value={course.id}>
                    {course.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                helperText="ZİP importta her PDF kendi dosya adı ile başlık alır."
                label="Başlık"
                onChange={(event) => setMaterialTitle(event.target.value)}
                value={materialTitle}
              />
              <TextField
                fullWidth
                label="Kaynak adı"
                onChange={(event) => setMaterialSourceName(event.target.value)}
                value={materialSourceName}
              />
              <Button
                disabled={!materialCourseId || !materialFile || materialImportMutation.isPending}
                onClick={startMaterialImport}
                startIcon={<PlayArrowOutlinedIcon />}
                variant="contained"
              >
                Materyal import başlat
              </Button>
            </Stack>
          </Paper>

          {materialImportMutation.isPending && <LinearProgress />}

          {materialResult && (
            <Stack spacing={2}>
              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { md: 'repeat(3, 1fr)', xs: 'repeat(1, 1fr)' } }}>
                <Metric label="Toplam dosya" value={materialResult.totalFiles} />
                <Metric label="Import edilen" value={materialResult.importedFiles} />
                <Metric label="Hata" value={materialResult.failedFiles} />
              </Box>
              <MaterialDocumentsTable documents={materialResult.documents} />
              {materialResult.errors.length > 0 && <ErrorTable errors={materialResult.errors} />}
            </Stack>
          )}
        </Stack>
      )}
    </Stack>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <Paper sx={{ borderRadius: 3, p: 2 }} variant="outlined">
      <Typography color="text.secondary" variant="body2">
        {label}
      </Typography>
      <Typography sx={{ fontSize: 28, fontWeight: 900 }}>{value}</Typography>
    </Paper>
  )
}

function ErrorTable({ errors }: { errors: ImportPreview['errors'] }) {
  if (errors.length === 0) {
    return <Alert severity="success">Validation hatası yok.</Alert>
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Row</TableCell>
            <TableCell>Column</TableCell>
            <TableCell>Message</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {errors.slice(0, 100).map((error, index) => (
            <TableRow key={`${error.rowNumber}-${error.columnName}-${index}`}>
              <TableCell>{error.rowNumber}</TableCell>
              <TableCell>{error.columnName || '-'}</TableCell>
              <TableCell>{error.errorMessage}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

function MaterialDocumentsTable({ documents }: { documents: MaterialImportResult['documents'] }) {
  if (documents.length === 0) {
    return <Alert severity="info">Import edilen materyal yok.</Alert>
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Başlık</TableCell>
            <TableCell>Dosya</TableCell>
            <TableCell>Sayfa</TableCell>
            <TableCell>Kaynak</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {documents.slice(0, 100).map((document) => (
            <TableRow key={document.id}>
              <TableCell>{document.title}</TableCell>
              <TableCell>{document.fileName}</TableCell>
              <TableCell>{document.pageCount}</TableCell>
              <TableCell>{document.sourceName}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

function DuplicateTable({
  decisions,
  duplicates,
  onActionChange,
}: {
  decisions: Record<number, DuplicateImportDecision>
  duplicates: ImportPreview['duplicates']
  onActionChange: (duplicate: ImportPreview['duplicates'][number], action: DuplicateImportAction) => void
}) {
  if (duplicates.length === 0) {
    return <Alert severity="success">Duplicate aday bulunmadı.</Alert>
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Row</TableCell>
            <TableCell>Match</TableCell>
            <TableCell>Score</TableCell>
            <TableCell>Aksiyon</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {duplicates.slice(0, 100).map((duplicate) => (
            <TableRow key={`${duplicate.rowNumber}-${duplicate.matchedQuestionId}`}>
              <TableCell>{duplicate.rowNumber}</TableCell>
              <TableCell>
                <Chip label={duplicateLabels[duplicate.matchType]} size="small" sx={{ mr: 1 }} />
                {duplicate.matchedQuestionText.slice(0, 120)}
              </TableCell>
              <TableCell>{Math.round(duplicate.similarityScore * 100)}%</TableCell>
              <TableCell>
                <Stack direction="row" spacing={1}>
                  {Object.values(DuplicateImportAction).filter((value) => typeof value === 'number').map((action) => {
                    const selectedAction = duplicate.rowNumber == null
                      ? DuplicateImportAction.Skip
                      : decisions[duplicate.rowNumber]?.action ?? DuplicateImportAction.Skip

                    return (
                      <Button
                        key={action}
                        size="small"
                        variant={selectedAction === action ? 'contained' : 'outlined'}
                        onClick={() => onActionChange(duplicate, action as DuplicateImportAction)}
                      >
                        {duplicateActionLabels[action as DuplicateImportAction]}
                      </Button>
                    )
                  })}
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

function buildDuplicateDecisions(
  duplicates: ImportPreview['duplicates'],
  decisions: Record<number, DuplicateImportDecision>,
): DuplicateImportDecision[] {
  const byRow = new Map<number, ImportPreview['duplicates'][number]>()

  for (const duplicate of duplicates) {
    if (duplicate.rowNumber == null) {
      continue
    }

    const current = byRow.get(duplicate.rowNumber)
    if (!current || duplicate.similarityScore > current.similarityScore) {
      byRow.set(duplicate.rowNumber, duplicate)
    }
  }

  return Array.from(byRow.values()).map((duplicate) => ({
    rowNumber: duplicate.rowNumber as number,
    matchedQuestionId: decisions[duplicate.rowNumber as number]?.matchedQuestionId ?? duplicate.matchedQuestionId,
    action: decisions[duplicate.rowNumber as number]?.action ?? DuplicateImportAction.Skip,
  }))
}
