import { FormEvent, useEffect, useMemo, useState } from 'react'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import TextSnippetOutlinedIcon from '@mui/icons-material/TextSnippetOutlined'
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded'
import { Box, Button, Card, CardContent, Dialog, DialogContent, DialogTitle, IconButton, InputAdornment, MenuItem, Stack, TextField, Tooltip, Typography } from '@mui/material'
import type { Course, SourceDocument, SourceDocumentText } from '../../models'
import { api } from '../../shared/api'
import { AdminPageHero } from '../common/AdminPageHero'
import { AdminSurface } from '../common/AdminSurface'
import { EmptyState } from '../common/EmptyState'
import { ErrorBanner } from '../common/ErrorBanner'

interface SourceDocumentsPageProps {
  courses: Course[]
  sourceDocuments: SourceDocument[]
  onChanged: () => Promise<void>
}

export function SourceDocumentsPage({ courses, sourceDocuments, onChanged }: SourceDocumentsPageProps) {
  const [courseId, setCourseId] = useState('')
  const [title, setTitle] = useState('')
  const [sourceName, setSourceName] = useState('SPK')
  const [file, setFile] = useState<File | null>(null)
  const [courseFilter, setCourseFilter] = useState('')
  const [search, setSearch] = useState('')
  const [detailDocument, setDetailDocument] = useState<SourceDocument | null>(null)
  const [textPreview, setTextPreview] = useState<SourceDocumentText | null>(null)
  const [pdfPreview, setPdfPreview] = useState<{ title: string; url: string } | null>(null)
  const [error, setError] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [busyId, setBusyId] = useState('')
  const [visibleCount, setVisibleCount] = useState(18)

  const filteredDocuments = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('tr-TR')

    return sourceDocuments.filter((document) => {
      const course = courses.find((item) => item.id === document.courseId)
      const matchesCourse = !courseFilter || document.courseId === courseFilter
      const matchesSearch =
        !term ||
        [document.title, document.fileName, document.sourceName, course?.name ?? '']
          .join(' ')
          .toLocaleLowerCase('tr-TR')
          .includes(term)

      return matchesCourse && matchesSearch
    })
  }, [courseFilter, courses, search, sourceDocuments])

  useEffect(() => {
    return () => {
      if (pdfPreview?.url) {
        URL.revokeObjectURL(pdfPreview.url)
      }
    }
  }, [pdfPreview?.url])

  function getCourseName(id: string) {
    return courses.find((course) => course.id === id)?.name ?? 'Ders bulunamadı'
  }

  function validateForm() {
    if (!courseId) return 'Ders seçmelisin.'
    if (title.trim().length < 3) return 'Başlık en az 3 karakter olmalı.'
    if (sourceName.trim().length < 2) return 'Kaynak adı en az 2 karakter olmalı.'
    if (!file) return 'PDF dosyası seçmelisin.'
    if (file.type !== 'application/pdf' || !file.name.toLocaleLowerCase('tr-TR').endsWith('.pdf')) return 'Yalnızca PDF dosyası yüklenebilir.'
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
    const data = new FormData()
    data.append('courseId', courseId)
    data.append('title', title.trim())
    data.append('sourceName', sourceName.trim())
    data.append('file', file as File)

    try {
      await api.uploadSourceDocument(data)
      setTitle('')
      setFile(null)
      setFieldError('')
      await onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF yüklenemedi.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(document: SourceDocument) {
    setBusyId(document.id)
    setError('')
    try {
      await api.deleteSourceDocument(document.id)
      await onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kaynak silinemedi.')
    } finally {
      setBusyId('')
    }
  }

  async function handleText(document: SourceDocument) {
    setBusyId(document.id)
    setError('')
    try {
      const text = document.textExtractedAt
        ? await api.getSourceDocumentText(document.id)
        : await api.extractSourceDocumentText(document.id)
      setTextPreview(text)
      await onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF metni alınamadı.')
    } finally {
      setBusyId('')
    }
  }

  async function handlePdf(document: SourceDocument) {
    setBusyId(document.id)
    setError('')
    try {
      const file = await api.downloadSourceDocument(document.id)
      const url = URL.createObjectURL(file)
      setPdfPreview((current) => {
        if (current?.url) {
          URL.revokeObjectURL(current.url)
        }
        return { title: document.title, url }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF görüntülenemedi.')
    } finally {
      setBusyId('')
    }
  }

  function closePdfPreview() {
    setPdfPreview((current) => {
      if (current?.url) {
        URL.revokeObjectURL(current.url)
      }
      return null
    })
  }

  return (
    <Stack spacing={3}>
      <AdminPageHero
        title="Kaynak PDF akışını yönetin."
        description="SPK veya kurum kaynaklı PDF'leri derslere bağlayın, metnini çıkarın ve içerik üretim pipeline'ına hazır hale getirin."
        actions={<Button startIcon={<UploadFileRoundedIcon />} variant="contained">PDF yönetimi</Button>}
      />
      {error && <ErrorBanner message={error} />}

      <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { lg: '0.95fr 1.05fr', xs: '1fr' } }}>
        <AdminSurface title="PDF yükle">
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              {fieldError && <ErrorBanner message={fieldError} />}
              <TextField fullWidth label="Ders" required select value={courseId} onChange={(event) => setCourseId(event.target.value)}>
                {courses.map((course) => <MenuItem key={course.id} value={course.id}>{course.name}</MenuItem>)}
              </TextField>
              <TextField fullWidth label="Başlık" required value={title} onChange={(event) => setTitle(event.target.value)} />
              <TextField fullWidth label="Kaynak adı" required value={sourceName} onChange={(event) => setSourceName(event.target.value)} />
              <Button component="label" variant="outlined">
                {file ? file.name : 'PDF seç'}
                <input hidden accept="application/pdf" type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
              </Button>
              <Button disabled={isSaving || courses.length === 0} type="submit" variant="contained">
                {isSaving ? 'Yükleniyor' : 'PDF yükle ve metin çıkar'}
              </Button>
            </Stack>
          </Box>
        </AdminSurface>

        <AdminSurface title="Kaynak arşivi">
          <Stack spacing={2}>
            <Stack direction={{ md: 'row', xs: 'column' }} spacing={2}>
              <TextField fullWidth label="Kaynak ara" value={search} onChange={(event) => setSearch(event.target.value)} slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> } }} />
              <TextField fullWidth label="Ders filtresi" select value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)}>
                <MenuItem value="">Tümü</MenuItem>
                {courses.map((course) => <MenuItem key={course.id} value={course.id}>{course.name}</MenuItem>)}
              </TextField>
            </Stack>

            <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { md: 'repeat(2, minmax(0, 1fr))', xs: '1fr' } }}>
              {filteredDocuments.length === 0 ? (
                <EmptyState title="Kaynak yok" description="Bir ders seçip ilk PDF kaynağını yükleyebilirsin." />
              ) : (
                filteredDocuments.slice(0, visibleCount).map((document) => (
                  <Card key={document.id} sx={{ borderRadius: 3, display: 'flex', height: '100%', minWidth: 0, overflow: 'hidden' }} variant="outlined">
                    <CardContent sx={{ display: 'flex', flexDirection: 'column', minHeight: 280, minWidth: 0, width: '100%' }}>
                      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, justifyContent: 'space-between', minWidth: 0 }}>
                        <Typography color="primary" sx={{ flex: '1 1 auto', fontWeight: 900, lineHeight: 1.2, minWidth: 0, whiteSpace: 'nowrap' }} variant="body2">{document.pageCount || 0} sayfa</Typography>
                        <Stack
                          direction="row"
                          spacing={0.25}
                          sx={{
                            alignItems: 'center',
                            border: '1px solid rgba(148,163,184,0.22)',
                            borderRadius: 2,
                            flex: '0 0 auto',
                            flexWrap: 'nowrap',
                            p: 0.25,
                          }}
                        >
                          <Tooltip title="Detay"><IconButton size="small" sx={{ flexShrink: 0, height: 32, width: 32 }} onClick={() => setDetailDocument(document)}><InfoOutlinedIcon fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="PDF"><IconButton size="small" sx={{ flexShrink: 0, height: 32, width: 32 }} disabled={busyId === document.id} onClick={() => void handlePdf(document)}><PictureAsPdfOutlinedIcon fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="Metin"><IconButton size="small" sx={{ flexShrink: 0, height: 32, width: 32 }} disabled={busyId === document.id} onClick={() => handleText(document)}><TextSnippetOutlinedIcon fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="Sil"><IconButton size="small" sx={{ flexShrink: 0, height: 32, width: 32 }} color="error" disabled={busyId === document.id} onClick={() => handleDelete(document)}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
                        </Stack>
                      </Stack>
                      <Typography sx={{ fontSize: 18, fontWeight: 900, mt: 1.5, overflowWrap: 'anywhere' }}>{document.title}</Typography>
                      <Typography color="text.secondary" sx={{ mt: 1, overflowWrap: 'anywhere' }}>{document.fileName}</Typography>
                      <Typography color="text.secondary" sx={{ mb: 2, mt: 2, overflowWrap: 'anywhere' }} variant="body2">{getCourseName(document.courseId)} · {document.sourceName}</Typography>
                      <Button
                        fullWidth
                        onClick={() => void handlePdf(document)}
                        startIcon={<PictureAsPdfOutlinedIcon />}
                        sx={{
                          borderRadius: 2,
                          fontWeight: 900,
                          minHeight: 44,
                          mt: 'auto',
                          '& .MuiButton-startIcon': { mr: 1 },
                        }}
                        variant="outlined"
                      >
                        PDF görüntüle
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </Box>
            {filteredDocuments.length > visibleCount && (
              <Button variant="outlined" onClick={() => setVisibleCount((current) => current + 18)}>
                {filteredDocuments.length - visibleCount} kaynak daha göster
              </Button>
            )}
          </Stack>
        </AdminSurface>
      </Box>

      <Dialog open={Boolean(detailDocument)} onClose={() => setDetailDocument(null)}>
        <DialogTitle>Kaynak detayı</DialogTitle>
        <DialogContent>
          {detailDocument && (
            <Stack spacing={1} sx={{ minWidth: { sm: 360, xs: 0 }, width: '100%' }}>
              <Typography><strong>Ders:</strong> {getCourseName(detailDocument.courseId)}</Typography>
              <Typography><strong>Dosya:</strong> {detailDocument.fileName}</Typography>
              <Typography><strong>Kaynak:</strong> {detailDocument.sourceName}</Typography>
              <Typography><strong>Metin çıkarma:</strong> {detailDocument.textExtractedAt || 'Henüz yok'}</Typography>
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(textPreview)} onClose={() => setTextPreview(null)} maxWidth="md" fullWidth>
        <DialogTitle>PDF metni</DialogTitle>
        <DialogContent>
          <Typography sx={{ whiteSpace: 'pre-wrap' }}>{textPreview?.extractedText || 'Metin bulunamadı.'}</Typography>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(pdfPreview)} onClose={closePdfPreview} maxWidth="lg" fullWidth>
        <DialogTitle>{pdfPreview?.title ?? 'PDF'}</DialogTitle>
        <DialogContent>
          {pdfPreview?.url && (
            <Box
              component="iframe"
              src={pdfPreview.url}
              title={pdfPreview.title}
              sx={{ border: 0, borderRadius: 2, height: '78vh', width: '100%' }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Stack>
  )
}
