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
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { DuplicateMatchType, ImportJobStatus, type ImportPreview } from '../../models/import'
import { importApi } from '../../shared/api'

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

export function AdminImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)

  const canStartImport = !!file && !!preview && preview.invalidRows === 0

  const previewMutation = useMutation({
    mutationFn: importApi.previewQuestions,
    onSuccess: (data) => {
      setPreview(data)
      toast.success('Import preview hazırlandı.')
    },
    onError: (error: Error) => toast.error(error.message || 'Preview oluşturulamadı.'),
  })

  const importMutation = useMutation({
    mutationFn: importApi.importQuestions,
    onSuccess: (job) => {
      setJobId(job.id)
      toast.success('Import job başlatıldı.')
    },
    onError: (error: Error) => toast.error(error.message || 'Import başlatılamadı.'),
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
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography sx={{ fontWeight: 900 }} variant="h4">
          Toplu import
        </Typography>
        <Typography color="text.secondary">
          CSV veya JSON soru dosyasını yükleyin, önce validation ve duplicate preview alın, sonra importu başlatın.
        </Typography>
      </Box>

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
          onClick={() => file && importMutation.mutate(file)}
          startIcon={<PlayArrowOutlinedIcon />}
          variant="outlined"
        >
          Importu Başlat
        </Button>
      </Stack>

      {(previewMutation.isPending || importMutation.isPending) && <LinearProgress />}

      {preview && (
        <Stack spacing={2}>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { md: 'repeat(4, 1fr)', xs: 'repeat(2, 1fr)' } }}>
            <Metric label="Toplam" value={preview.totalRows} />
            <Metric label="Valid" value={preview.validRows} />
            <Metric label="Invalid" value={preview.invalidRows} />
            <Metric label="Duplicate" value={preview.duplicateRows} />
          </Box>

          {(preview.missingCourses.length > 0 || preview.missingTopics.length > 0) && (
            <Alert severity="warning">
              Eksik dersler: {preview.missingCourses.join(', ') || '-'} | Eksik konular: {preview.missingTopics.join(', ') || '-'}
            </Alert>
          )}

          <ErrorTable errors={preview.errors} />
          <DuplicateTable duplicates={preview.duplicates} />
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

function DuplicateTable({ duplicates }: { duplicates: ImportPreview['duplicates'] }) {
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
                  <Button size="small">Skip</Button>
                  <Button size="small">Overwrite</Button>
                  <Button size="small">Create new</Button>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
