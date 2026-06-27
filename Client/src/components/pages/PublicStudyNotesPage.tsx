import { useEffect, useMemo, useState } from 'react'
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import {
  Box,
  Chip,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import type { PublicStudyNote } from '../../models'
import { api } from '../../shared/api'
import { EmptyState } from '../common/EmptyState'
import { ErrorBanner } from '../common/ErrorBanner'

function getPreview(content: string) {
  return content.length > 220 ? `${content.slice(0, 220).trim()}...` : content
}

export function PublicStudyNotesPage() {
  const [notes, setNotes] = useState<PublicStudyNote[]>([])
  const [search, setSearch] = useState('')
  const [licenseId, setLicenseId] = useState('')
  const [courseId, setCourseId] = useState('')
  const [selectedNote, setSelectedNote] = useState<PublicStudyNote | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    void loadNotes()
  }, [])

  const licenses = useMemo(() => {
    const unique = new Map<string, string>()
    notes.forEach((note) => unique.set(note.licenseId, note.licenseName))
    return Array.from(unique, ([id, name]) => ({ id, name }))
  }, [notes])

  const courses = useMemo(() => {
    const unique = new Map<string, string>()
    notes.filter((note) => !licenseId || note.licenseId === licenseId).forEach((note) => unique.set(note.courseId, note.courseName))
    return Array.from(unique, ([id, name]) => ({ id, name }))
  }, [licenseId, notes])

  const filteredNotes = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return notes.filter((note) => {
      const matchesLicense = !licenseId || note.licenseId === licenseId
      const matchesCourse = !courseId || note.courseId === courseId
      const matchesSearch =
        !keyword ||
        note.title.toLowerCase().includes(keyword) ||
        note.content.toLowerCase().includes(keyword) ||
        note.topicTitle.toLowerCase().includes(keyword)

      return matchesLicense && matchesCourse && matchesSearch
    })
  }, [courseId, licenseId, notes, search])

  async function loadNotes() {
    setError('')
    setIsLoading(true)

    try {
      setNotes(await api.getPublicStudyNotes())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ders notları alınamadı.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box>
      <Box component="section" sx={{ bgcolor: '#0f172a', color: '#fff' }}>
        <Container maxWidth="xl" sx={{ py: { md: 8, xs: 5 } }}>
          <Stack spacing={2.5} sx={{ maxWidth: 760 }}>
            <Chip
              icon={<MenuBookOutlinedIcon />}
              label="Public ders notları"
              sx={{ alignSelf: 'flex-start', bgcolor: 'rgba(255,255,255,0.12)', color: '#fff' }}
            />
            <Typography component="h1" sx={{ fontSize: { md: 50, xs: 34 }, fontWeight: 800 }}>
              SPK ders notlarını lisans ve ders bazında incele.
            </Typography>
            <Typography sx={{ color: '#cbd5e1', fontSize: { md: 19, xs: 17 }, lineHeight: 1.7 }}>
              Yayınlanmış konu notlarını ara, filtrele ve çalışma kapsamını gör. Tam çalışma takibi için hesap
              oluşturarak öğrenci paneline geçebilirsin.
            </Typography>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: { md: 6, xs: 4 } }}>
        {error && <ErrorBanner message={error} />}

        <Paper sx={{ mb: 3, p: 2 }} variant="outlined">
          <Stack direction={{ md: 'row', xs: 'column' }} spacing={2}>
            <TextField
              fullWidth
              placeholder="Not, konu veya içerik ara"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlinedIcon />
                    </InputAdornment>
                  ),
                },
              }}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <TextField
              fullWidth
              label="Lisans"
              select
              value={licenseId}
              onChange={(event) => {
                setLicenseId(event.target.value)
                setCourseId('')
              }}
            >
              <MenuItem value="">Tümü</MenuItem>
              {licenses.map((license) => (
                <MenuItem key={license.id} value={license.id}>
                  {license.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField fullWidth label="Ders" select value={courseId} onChange={(event) => setCourseId(event.target.value)}>
              <MenuItem value="">Tümü</MenuItem>
              {courses.map((course) => (
                <MenuItem key={course.id} value={course.id}>
                  {course.name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </Paper>

        {isLoading ? (
          <EmptyState title="Ders notları yükleniyor" description="Yayınlanmış notlar hazırlanıyor." />
        ) : filteredNotes.length === 0 ? (
          <EmptyState title="Yayınlanmış ders notu yok" description="Onaylı ders notları burada listelenecek." />
        ) : (
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { md: 'repeat(2, 1fr)', xs: '1fr' } }}>
            {filteredNotes.map((note) => (
              <Paper key={note.id} sx={{ p: 3 }} variant="outlined">
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  <Chip label={note.licenseName} size="small" />
                  <Chip label={note.courseName} size="small" variant="outlined" />
                  <Chip label={note.topicTitle} size="small" variant="outlined" />
                </Stack>
                <Typography variant="h2">{note.title}</Typography>
                <Typography color="text.secondary" sx={{ lineHeight: 1.8, mt: 1.5, whiteSpace: 'pre-line' }}>
                  {getPreview(note.content)}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1} sx={{ justifyContent: 'space-between' }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <AutoStoriesOutlinedIcon color="primary" fontSize="small" />
                    <Typography color="text.secondary" variant="body2">
                      {note.sourceReference || 'Kaynak referansı eklenmemiş'}
                    </Typography>
                  </Stack>
                  <Chip clickable label="Detay" onClick={() => setSelectedNote(note)} />
                </Stack>
              </Paper>
            ))}
          </Box>
        )}
      </Container>

      <Dialog fullWidth maxWidth="md" open={Boolean(selectedNote)} onClose={() => setSelectedNote(null)}>
        {selectedNote && (
          <>
            <DialogTitle>{selectedNote.title}</DialogTitle>
            <DialogContent>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mb: 2 }}>
                <Chip label={selectedNote.licenseName} />
                <Chip label={selectedNote.courseName} variant="outlined" />
                <Chip label={selectedNote.topicTitle} variant="outlined" />
              </Stack>
              <Typography sx={{ lineHeight: 1.9, whiteSpace: 'pre-line' }}>{selectedNote.content}</Typography>
              {selectedNote.sourceReference && (
                <Typography color="text.secondary" sx={{ mt: 3 }}>
                  Kaynak: {selectedNote.sourceReference}
                </Typography>
              )}
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  )
}
