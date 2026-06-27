import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import ExpandLessOutlinedIcon from '@mui/icons-material/ExpandLessOutlined'
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined'
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined'
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined'
import ReplayOutlinedIcon from '@mui/icons-material/ReplayOutlined'
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined'
import NoteAltOutlinedIcon from '@mui/icons-material/NoteAltOutlined'
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import StarBorderOutlinedIcon from '@mui/icons-material/StarBorderOutlined'
import StarOutlinedIcon from '@mui/icons-material/StarOutlined'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link as RouterLink } from 'react-router'
import { toast } from 'react-toastify'
import { EmptyState } from '../../components/common/EmptyState'
import { StudentPageHero } from '../../components/common/StudentPageHero'
import { MaterialHighlightColor, type MyMaterialNote } from '../../models'
import { materialsApi } from '../../shared/api'
import { useMyNotes } from './hooks/useStudentContentDiscovery'

const favoriteStorageKey = 'spk.favoriteMaterialNotes'

export function MyNotesPage() {
  const queryClient = useQueryClient()
  const notesQuery = useMyNotes()
  const notes = useMemo(() => notesQuery.data ?? [], [notesQuery.data])
  const [search, setSearch] = useState('')
  const [courseName, setCourseName] = useState('')
  const [materialId, setMaterialId] = useState('')
  const [folderName, setFolderName] = useState('')
  const [tagName, setTagName] = useState('')
  const [colorFilter, setColorFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [pageFrom, setPageFrom] = useState('')
  const [pageTo, setPageTo] = useState('')
  const [onlyFavorites, setOnlyFavorites] = useState(false)
  const [editingNote, setEditingNote] = useState<MyMaterialNote | null>(null)
  const [editText, setEditText] = useState('')
  const [editColor, setEditColor] = useState<MaterialHighlightColor>(MaterialHighlightColor.Yellow)
  const [editFolder, setEditFolder] = useState('')
  const [editTags, setEditTags] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<MyMaterialNote | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkOrganizeOpen, setBulkOrganizeOpen] = useState(false)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkFolder, setBulkFolder] = useState('')
  const [bulkTags, setBulkTags] = useState('')
  const [insightsOpen, setInsightsOpen] = useState(true)

  const selectedNotes = useMemo(
    () => notes.filter((note) => selectedIds.has(note.id)),
    [notes, selectedIds],
  )

  const bulkMutation = useMutation({
    mutationFn: async ({
      action,
      folder,
      tags,
    }: {
      action: 'favorite' | 'review' | 'organize' | 'delete'
      folder?: string
      tags?: string[]
    }) => {
      if (selectedNotes.length === 0) {
        throw new Error('İşlem yapılacak not seçilmedi.')
      }

      await Promise.all(selectedNotes.map((note) => {
        switch (action) {
          case 'favorite':
            return materialsApi.updateNote(note.id, { isFavorite: true })
          case 'review':
            return materialsApi.updateNote(note.id, { isInReview: true })
          case 'organize':
            return materialsApi.updateNote(note.id, {
              folderName: folder?.trim() ?? '',
              tags: tags ?? [],
            })
          case 'delete':
            return materialsApi.deleteNote(note.id)
        }
      }))

      return action
    },
    onSuccess: async (action) => {
      setSelectedIds(new Set())
      setBulkOrganizeOpen(false)
      setBulkDeleteOpen(false)
      setBulkFolder('')
      setBulkTags('')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['student-content', 'notes'] }),
        queryClient.invalidateQueries({ queryKey: ['materials'] }),
        queryClient.invalidateQueries({ queryKey: ['material-note-reviews'] }),
      ])
      toast.success({
        favorite: 'Seçili notlar favorilere eklendi.',
        review: 'Seçili notlar tekrar listesine eklendi.',
        organize: 'Seçili notlar sınıflandırıldı.',
        delete: 'Seçili notlar silindi.',
      }[action])
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Toplu işlem tamamlanamadı.'),
  })

  const favoriteMutation = useMutation({
    mutationFn: (note: MyMaterialNote) =>
      materialsApi.updateNote(note.id, { isFavorite: !note.isFavorite }),
    onMutate: async (note) => {
      await queryClient.cancelQueries({ queryKey: ['student-content', 'notes'] })
      const previous = queryClient.getQueryData<MyMaterialNote[]>(['student-content', 'notes'])
      queryClient.setQueryData<MyMaterialNote[]>(['student-content', 'notes'], (current) =>
        current?.map((item) =>
          item.id === note.id ? { ...item, isFavorite: !item.isFavorite } : item,
        ),
      )
      return { previous }
    },
    onError: (error, _, context) => {
      queryClient.setQueryData(['student-content', 'notes'], context?.previous)
      toast.error(error instanceof Error ? error.message : 'Favori güncellenemedi.')
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['student-content', 'notes'] })
    },
  })

  const reviewQueueMutation = useMutation({
    mutationFn: (note: MyMaterialNote) =>
      materialsApi.updateNote(note.id, { isInReview: !note.isInReview }),
    onSuccess: async (_, note) => {
      toast.success(note.isInReview ? 'Not tekrar listesinden çıkarıldı.' : 'Not tekrar listesine eklendi.')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['student-content', 'notes'] }),
        queryClient.invalidateQueries({ queryKey: ['material-note-reviews'] }),
      ])
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Tekrar listesi güncellenemedi.'),
  })

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editingNote) {
        throw new Error('Düzenlenecek not bulunamadı.')
      }

      return materialsApi.updateNote(editingNote.id, {
        note: editText.trim(),
        highlightColor: editColor,
        folderName: editFolder.trim(),
        tags: parseTagInput(editTags),
      })
    },
    onSuccess: async () => {
      const materialId = editingNote?.materialId
      setEditingNote(null)
      toast.success('Not güncellendi.')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['student-content', 'notes'] }),
        materialId
          ? queryClient.invalidateQueries({ queryKey: ['materials', materialId, 'notes'] })
          : Promise.resolve(),
      ])
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Not güncellenemedi.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (note: MyMaterialNote) => materialsApi.deleteNote(note.id),
    onSuccess: async (_, note) => {
      setDeleteTarget(null)
      toast.success('Not silindi.')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['student-content', 'notes'] }),
        queryClient.invalidateQueries({ queryKey: ['materials', note.materialId, 'notes'] }),
      ])
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Not silinemedi.'),
  })

  const courseNames = useMemo(
    () => Array.from(new Set(notes.map((note) => note.courseName))).sort((a, b) => a.localeCompare(b)),
    [notes],
  )
  const materials = useMemo(
    () => Array.from(
      new Map(notes.map((note) => [note.materialId, note.materialTitle])).entries(),
    )
      .map(([id, title]) => ({ id, title }))
      .sort((a, b) => a.title.localeCompare(b.title, 'tr')),
    [notes],
  )
  const folderNames = useMemo(
    () => Array.from(new Set(notes.map((note) => note.folderName).filter(Boolean) as string[]))
      .sort((a, b) => a.localeCompare(b, 'tr')),
    [notes],
  )
  const tagNames = useMemo(
    () => Array.from(new Set(notes.flatMap((note) => note.tags)))
      .sort((a, b) => a.localeCompare(b, 'tr')),
    [notes],
  )

  const filteredNotes = useMemo(() => {
    const normalizedSearch = normalizeSearchText(search)
    const minimumPage = pageFrom ? Number(pageFrom) : null
    const maximumPage = pageTo ? Number(pageTo) : null
    const minimumDate = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null
    const maximumDate = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : null

    return notes
      .filter((note) => !courseName || note.courseName === courseName)
      .filter((note) => !materialId || note.materialId === materialId)
      .filter((note) => !folderName || note.folderName === folderName)
      .filter((note) => !tagName || note.tags.includes(tagName))
      .filter((note) => !colorFilter || note.highlightColor === Number(colorFilter))
      .filter((note) => minimumPage == null || note.pageNumber >= minimumPage)
      .filter((note) => maximumPage == null || note.pageNumber <= maximumPage)
      .filter((note) => {
        if (minimumDate == null && maximumDate == null) return true
        const noteDate = new Date(note.updatedAt ?? note.createdAt).getTime()
        return (minimumDate == null || noteDate >= minimumDate) &&
          (maximumDate == null || noteDate <= maximumDate)
      })
      .filter((note) => !onlyFavorites || note.isFavorite)
      .filter((note) => {
        if (!normalizedSearch) return true
        return normalizeSearchText(
          `${note.note} ${note.selectedText ?? ''} ${note.materialTitle} ${note.courseName} ${note.folderName ?? ''} ${note.tags.join(' ')}`,
        )
          .includes(normalizedSearch)
      })
      .sort((left, right) => {
        const leftTime = new Date(left.updatedAt ?? left.createdAt).getTime()
        const rightTime = new Date(right.updatedAt ?? right.createdAt).getTime()
        return rightTime - leftTime
      })
  }, [
    colorFilter,
    courseName,
    dateFrom,
    dateTo,
    folderName,
    materialId,
    notes,
    onlyFavorites,
    pageFrom,
    pageTo,
    search,
    tagName,
  ])

  const activeFilterCount = [
    search,
    courseName,
    materialId,
    folderName,
    tagName,
    colorFilter,
    dateFrom,
    dateTo,
    pageFrom,
    pageTo,
    onlyFavorites ? 'favorites' : '',
  ].filter(Boolean).length
  const exportNotes = selectedNotes.length > 0 ? selectedNotes : filteredNotes
  const noteInsights = useMemo(() => buildNoteInsights(filteredNotes), [filteredNotes])

  useEffect(() => {
    if (!notesQuery.data) {
      return
    }

    const legacyFavoriteIds = readFavoriteIds()
    if (legacyFavoriteIds.size === 0) {
      return
    }

    const notesToMigrate = notesQuery.data.filter(
      (note) => legacyFavoriteIds.has(note.id) && !note.isFavorite,
    )

    if (notesToMigrate.length === 0) {
      window.localStorage.removeItem(favoriteStorageKey)
      return
    }

    void Promise.all(
      notesToMigrate.map((note) => materialsApi.updateNote(note.id, { isFavorite: true })),
    )
      .then(() => {
        window.localStorage.removeItem(favoriteStorageKey)
        return queryClient.invalidateQueries({ queryKey: ['student-content', 'notes'] })
      })
      .then(() => toast.success('Mevcut favorilerin hesabına taşındı.'))
      .catch(() => toast.error('Bazı eski favoriler hesaba taşınamadı.'))
  }, [notesQuery.data, queryClient])

  function openEdit(note: MyMaterialNote) {
    setEditingNote(note)
    setEditText(note.note)
    setEditColor(note.highlightColor)
    setEditFolder(note.folderName ?? '')
    setEditTags(note.tags.join(', '))
  }

  function clearFilters() {
    setSearch('')
    setCourseName('')
    setMaterialId('')
    setFolderName('')
    setTagName('')
    setColorFilter('')
    setDateFrom('')
    setDateTo('')
    setPageFrom('')
    setPageTo('')
    setOnlyFavorites(false)
  }

  function toggleSelection(noteId: string) {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(noteId)) {
        next.delete(noteId)
      } else {
        next.add(noteId)
      }
      return next
    })
  }

  function selectVisibleNotes() {
    setSelectedIds(new Set(filteredNotes.map((note) => note.id)))
  }

  function exportMarkdown() {
    if (exportNotes.length === 0) return
    downloadTextFile(
      buildExportFileName('md'),
      buildMarkdownExport(exportNotes),
      'text/markdown;charset=utf-8',
    )
    toast.success(`${exportNotes.length} not Markdown olarak indirildi.`)
  }

  function exportWord() {
    if (exportNotes.length === 0) return
    downloadTextFile(
      buildExportFileName('doc'),
      buildWordExport(exportNotes),
      'application/msword;charset=utf-8',
    )
    toast.success(`${exportNotes.length} not Word belgesi olarak indirildi.`)
  }

  function exportPdf() {
    if (exportNotes.length === 0) return
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('Yazdırma penceresi açılamadı. Açılır pencere iznini kontrol et.')
      return
    }

    printWindow.document.open()
    printWindow.document.write(buildPrintableExport(exportNotes))
    printWindow.document.close()
  }

  if (notesQuery.isLoading) {
    return (
      <Stack spacing={2}>
        <Skeleton height={180} variant="rounded" />
        <Skeleton height={80} variant="rounded" />
        <Skeleton height={360} variant="rounded" />
      </Stack>
    )
  }

  if (notesQuery.isError) {
    return (
      <Alert severity="error">
        {notesQuery.error instanceof Error ? notesQuery.error.message : 'Notlar yüklenemedi.'}
      </Alert>
    )
  }

  return (
    <Stack spacing={3}>
      <StudentPageHero
        eyebrow="İçerik Keşfi"
        title="Notlarım"
        description="PDF üzerinde aldığın notları, seçili metinleri ve sayfa bağlamını tek ekranda ara ve ilgili kaynaga geri dön."
        sideContent={
          <Paper sx={{ borderRadius: 3, p: 2.5 }} variant="outlined">
            <Typography color="text.secondary" sx={{ fontSize: 13, fontWeight: 800 }}>
              KAYITLI NOT
            </Typography>
            <Typography sx={{ fontSize: 42, fontWeight: 900 }}>{notes.length}</Typography>
            <Typography color="text.secondary" variant="body2">
              {notes.filter((note) => note.isFavorite).length} not favorilere eklendi.
            </Typography>
          </Paper>
        }
      />

      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }} variant="outlined">
        <Button
          aria-expanded={insightsOpen}
          endIcon={insightsOpen ? <ExpandLessOutlinedIcon /> : <ExpandMoreOutlinedIcon />}
          fullWidth
          onClick={() => setInsightsOpen((current) => !current)}
          sx={{
            borderRadius: 0,
            justifyContent: 'space-between',
            px: 2.5,
            py: 2,
            textAlign: 'left',
          }}
        >
          <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
            <InsightsOutlinedIcon />
            <Box>
              <Typography sx={{ fontWeight: 900 }}>Not çalışma içgörüleri</Typography>
              <Typography color="text.secondary" variant="body2">
                {activeFilterCount > 0
                  ? `${filteredNotes.length} filtrelenmiş not üzerinden hesaplanıyor`
                  : 'Tüm not arşivin üzerinden hesaplanıyor'}
              </Typography>
            </Box>
          </Stack>
        </Button>

        <Collapse in={insightsOpen}>
          <Box sx={{ borderTop: 1, borderColor: 'divider', p: 2.5 }}>
            {filteredNotes.length === 0 ? (
              <Alert severity="info">İçgörü oluşturmak için filtrelere uyan en az bir not gerekli.</Alert>
            ) : (
              <Stack spacing={2.5}>
                <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { md: 'repeat(4, 1fr)', sm: 'repeat(2, 1fr)', xs: '1fr' } }}>
                  <InsightMetric
                    detail={`${noteInsights.uniqueCourseCount} farklı ders`}
                    label="İncelenen not"
                    value={String(filteredNotes.length)}
                  />
                  <InsightMetric
                    detail={`${noteInsights.uniqueMaterialCount} PDF içinde`}
                    label="Çalışılan sayfa"
                    value={String(noteInsights.uniquePageCount)}
                  />
                  <InsightMetric
                    detail="Son 7 gündeki hareket"
                    label="Yeni / güncellenen"
                    value={String(noteInsights.recentCount)}
                  />
                  <InsightMetric
                    detail={`${noteInsights.reviewCount} tekrar listesinde`}
                    label="Favori not"
                    value={String(noteInsights.favoriteCount)}
                  />
                </Box>

                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { lg: '1.15fr 1fr 1fr', xs: '1fr' } }}>
                  <InsightRanking
                    emptyText="PDF dağılımı oluşmadı."
                    items={noteInsights.topMaterials}
                    title="En çok not alınan PDF'ler"
                  />
                  <InsightRanking
                    emptyText="Ders dağılımı oluşmadı."
                    items={noteInsights.topCourses}
                    title="Ders dağılımı"
                  />
                  <Stack spacing={2}>
                    <InsightProgress
                      label="Klasör veya etiketle düzenlenen"
                      value={noteInsights.organizedPercentage}
                    />
                    <InsightProgress
                      label="Tekrar programına alınan"
                      value={noteInsights.reviewPercentage}
                    />
                    <Box>
                      <Typography sx={{ fontWeight: 800, mb: 1 }} variant="body2">
                        En çok kullanılan etiketler
                      </Typography>
                      <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', rowGap: 0.75 }}>
                        {noteInsights.topTags.length > 0
                          ? noteInsights.topTags.map((item) => (
                            <Chip key={item.label} label={`#${item.label} · ${item.count}`} size="small" />
                          ))
                          : <Typography color="text.secondary" variant="body2">Henüz etiket kullanılmamış.</Typography>}
                      </Stack>
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 800, mb: 1 }} variant="body2">
                        Vurgu renkleri
                      </Typography>
                      <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', rowGap: 0.75 }}>
                        {noteInsights.colorCounts.map((item) => (
                          <Chip
                            key={item.color}
                            label={`${highlightColorLabel(item.color)} · ${item.count}`}
                            size="small"
                            sx={{ bgcolor: highlightBackground(item.color) }}
                          />
                        ))}
                      </Stack>
                    </Box>
                  </Stack>
                </Box>
              </Stack>
            )}
          </Box>
        </Collapse>
      </Paper>

      <Paper sx={{ borderRadius: 3, p: 2 }} variant="outlined">
        <Stack spacing={1.5}>
          <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <FilterAltOutlinedIcon color="primary" />
              <Typography sx={{ fontWeight: 800 }}>Gelişmiş arama</Typography>
              <Chip label={`${filteredNotes.length} / ${notes.length} not`} size="small" />
              {activeFilterCount > 0 && <Chip color="primary" label={`${activeFilterCount} aktif filtre`} size="small" />}
            </Stack>
            <Button
              disabled={activeFilterCount === 0}
              onClick={clearFilters}
              startIcon={<RestartAltOutlinedIcon />}
              size="small"
            >
              Filtreleri temizle
            </Button>
          </Stack>

          <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { lg: '2fr repeat(4, minmax(160px, 1fr))', xs: '1fr' } }}>
            <TextField
              fullWidth
              label="Not, seçili metin, PDF, ders veya etiket ara"
              onChange={(event) => setSearch(event.target.value)}
              value={search}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlinedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField label="Ders" onChange={(event) => setCourseName(event.target.value)} select value={courseName}>
              <MenuItem value="">Tüm dersler</MenuItem>
              {courseNames.map((name) => <MenuItem key={name} value={name}>{name}</MenuItem>)}
            </TextField>
            <TextField label="PDF" onChange={(event) => setMaterialId(event.target.value)} select value={materialId}>
              <MenuItem value="">Tüm PDF’ler</MenuItem>
              {materials.map((material) => <MenuItem key={material.id} value={material.id}>{material.title}</MenuItem>)}
            </TextField>
            <TextField label="Klasör" onChange={(event) => setFolderName(event.target.value)} select value={folderName}>
              <MenuItem value="">Tüm klasörler</MenuItem>
              {folderNames.map((name) => <MenuItem key={name} value={name}>{name}</MenuItem>)}
            </TextField>
            <TextField label="Etiket" onChange={(event) => setTagName(event.target.value)} select value={tagName}>
              <MenuItem value="">Tüm etiketler</MenuItem>
              {tagNames.map((name) => <MenuItem key={name} value={name}>{name}</MenuItem>)}
            </TextField>
          </Box>

          <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { lg: 'repeat(5, minmax(140px, 1fr)) auto', xs: '1fr' } }}>
            <TextField label="Vurgu rengi" onChange={(event) => setColorFilter(event.target.value)} select value={colorFilter}>
              <MenuItem value="">Tüm renkler</MenuItem>
              {highlightColorOptions.map((option) => (
                <MenuItem key={option.value} value={String(option.value)}>{option.label}</MenuItem>
              ))}
            </TextField>
            <TextField label="Başlangıç tarihi" onChange={(event) => setDateFrom(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} type="date" value={dateFrom} />
            <TextField label="Bitiş tarihi" onChange={(event) => setDateTo(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} type="date" value={dateTo} />
            <TextField label="İlk sayfa" onChange={(event) => setPageFrom(event.target.value)} slotProps={{ htmlInput: { min: 1 } }} type="number" value={pageFrom} />
            <TextField label="Son sayfa" onChange={(event) => setPageTo(event.target.value)} slotProps={{ htmlInput: { min: 1 } }} type="number" value={pageTo} />
            <Button
              color={onlyFavorites ? 'warning' : 'inherit'}
              onClick={() => setOnlyFavorites((value) => !value)}
              startIcon={onlyFavorites ? <StarOutlinedIcon /> : <StarBorderOutlinedIcon />}
              variant={onlyFavorites ? 'contained' : 'outlined'}
            >
              Favoriler
            </Button>
          </Box>
        </Stack>
      </Paper>

      <Paper
        sx={{
          borderColor: selectedIds.size > 0 ? 'primary.main' : 'divider',
          borderRadius: 3,
          p: 2,
        }}
        variant="outlined"
      >
        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: { xl: '0.9fr 1.2fr 1.4fr', xs: '1fr' },
          }}
        >
          <ActionGroup
            description={`${selectedIds.size} not seçili`}
            title="Not seçimi"
          >
            <Button
              disabled={filteredNotes.length === 0}
              onClick={selectVisibleNotes}
              size="small"
              variant="outlined"
            >
              Görünenleri seç
            </Button>
            <Button
              disabled={selectedIds.size === 0}
              onClick={() => setSelectedIds(new Set())}
              size="small"
            >
              Seçimi kaldır
            </Button>
          </ActionGroup>

          <ActionGroup
            description={selectedNotes.length > 0
              ? `${selectedNotes.length} seçili not`
              : `${filteredNotes.length} filtrelenmiş not`}
            title="Dışa aktar"
          >
            <Button
              disabled={exportNotes.length === 0}
              onClick={exportMarkdown}
              size="small"
              startIcon={<DownloadOutlinedIcon />}
              variant="outlined"
            >
              Markdown
            </Button>
            <Button
              disabled={exportNotes.length === 0}
              onClick={exportWord}
              size="small"
              startIcon={<DescriptionOutlinedIcon />}
              variant="outlined"
            >
              Word
            </Button>
            <Button
              disabled={exportNotes.length === 0}
              onClick={exportPdf}
              size="small"
              startIcon={<PictureAsPdfOutlinedIcon />}
              variant="outlined"
            >
              PDF / Yazdır
            </Button>
          </ActionGroup>

          <ActionGroup
            description={selectedIds.size > 0 ? `${selectedIds.size} nota uygulanacak` : 'Önce not seçmelisin'}
            title="Toplu işlemler"
          >
            <Button
              disabled={selectedIds.size === 0 || bulkMutation.isPending}
              onClick={() => bulkMutation.mutate({ action: 'favorite' })}
              size="small"
              startIcon={<StarOutlinedIcon />}
              variant="outlined"
            >
              Favorile
            </Button>
            <Button
              disabled={selectedIds.size === 0 || bulkMutation.isPending}
              onClick={() => bulkMutation.mutate({ action: 'review' })}
              size="small"
              startIcon={<ReplayOutlinedIcon />}
              variant="outlined"
            >
              Tekrara ekle
            </Button>
            <Button
              disabled={selectedIds.size === 0 || bulkMutation.isPending}
              onClick={() => setBulkOrganizeOpen(true)}
              size="small"
              variant="outlined"
            >
              Klasör / etiket
            </Button>
            <Button
              color="error"
              disabled={selectedIds.size === 0 || bulkMutation.isPending}
              onClick={() => setBulkDeleteOpen(true)}
              size="small"
              startIcon={<DeleteOutlineOutlinedIcon />}
              variant="outlined"
            >
              Sil
            </Button>
          </ActionGroup>
        </Box>
      </Paper>

      {filteredNotes.length === 0 ? (
        <EmptyState title="Not bulunamadı" description="Filtreleri değiştir veya tüm filtreleri temizleyerek tekrar dene." />
      ) : (
        <Stack spacing={1.5}>
          {filteredNotes.map((note) => (
            <Paper
              key={note.id}
              sx={{
                borderColor: selectedIds.has(note.id) ? 'primary.main' : 'divider',
                borderRadius: 3,
                boxShadow: selectedIds.has(note.id) ? '0 0 0 1px rgba(15,118,110,0.18)' : 'none',
                p: 2.5,
              }}
              variant="outlined"
            >
              <Stack direction={{ md: 'row', xs: 'column' }} spacing={2} sx={{ justifyContent: 'space-between' }}>
                <Stack direction="row" spacing={1.5} sx={{ minWidth: 0 }}>
                  <Checkbox
                    checked={selectedIds.has(note.id)}
                    onChange={() => toggleSelection(note.id)}
                    slotProps={{ input: { 'aria-label': `${note.materialTitle} notunu seç` } }}
                    sx={{ alignSelf: 'flex-start', p: 0.5 }}
                  />
                  <Box
                    sx={{
                      alignItems: 'center',
                      bgcolor: highlightBackground(note.highlightColor),
                      borderRadius: 2,
                      color: 'text.primary',
                      display: 'flex',
                      flexShrink: 0,
                      height: 42,
                      justifyContent: 'center',
                      width: 42,
                    }}
                  >
                    <NoteAltOutlinedIcon />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                      <Typography sx={{ fontWeight: 900 }}>{note.materialTitle}</Typography>
                      <Chip label={`Sayfa ${note.pageNumber}`} size="small" />
                      <Chip label={highlightColorLabel(note.highlightColor)} size="small" variant="outlined" />
                      {note.folderName && <Chip color="primary" label={note.folderName} size="small" variant="outlined" />}
                      {note.tags.map((tag) => (
                        <Chip key={tag} label={`#${tag}`} size="small" />
                      ))}
                    </Stack>
                    <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">
                      {note.courseName} · {formatDate(note.createdAt)}
                    </Typography>
                    {note.selectedText && (
                      <Typography color="text.secondary" sx={{ mt: 1.25 }} variant="body2">
                        "{note.selectedText.length > 180 ? `${note.selectedText.slice(0, 180)}...` : note.selectedText}"
                      </Typography>
                    )}
                    <Typography sx={{ lineHeight: 1.75, mt: 1 }}>{note.note}</Typography>
                  </Box>
                </Stack>

                <Stack direction={{ md: 'column', xs: 'row' }} spacing={1} sx={{ alignItems: { md: 'flex-end', xs: 'center' }, flexShrink: 0 }}>
                  <Stack direction="row" spacing={0.5}>
                    <IconButton
                      aria-label={note.isFavorite ? 'Favoriden çıkar' : 'Favoriye ekle'}
                      disabled={favoriteMutation.isPending}
                      onClick={() => favoriteMutation.mutate(note)}
                    >
                      {note.isFavorite ? <StarOutlinedIcon color="warning" /> : <StarBorderOutlinedIcon />}
                    </IconButton>
                    <IconButton aria-label="Notu düzenle" color="primary" onClick={() => openEdit(note)}>
                      <EditOutlinedIcon />
                    </IconButton>
                    <IconButton
                      aria-label={note.isInReview ? 'Tekrar listesinden çıkar' : 'Tekrar listesine ekle'}
                      color={note.isInReview ? 'success' : 'default'}
                      disabled={reviewQueueMutation.isPending}
                      onClick={() => reviewQueueMutation.mutate(note)}
                    >
                      <ReplayOutlinedIcon />
                    </IconButton>
                    <IconButton aria-label="Notu sil" color="error" onClick={() => setDeleteTarget(note)}>
                      <DeleteOutlineOutlinedIcon />
                    </IconButton>
                  </Stack>
                  <Button
                    component={RouterLink}
                    endIcon={<ArrowForwardOutlinedIcon />}
                    to={`/materials/viewer/${note.materialId}?page=${note.pageNumber}&noteId=${note.id}`}
                    variant="contained"
                  >
                    PDF'e dön
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      <Dialog
        fullWidth
        maxWidth="sm"
        onClose={() => !updateMutation.isPending && setEditingNote(null)}
        open={Boolean(editingNote)}
      >
        <DialogTitle>Notu düzenle</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {editingNote?.selectedText && (
              <Alert severity="info">
                Seçili metin: “{editingNote.selectedText.length > 220
                  ? `${editingNote.selectedText.slice(0, 220)}…`
                  : editingNote.selectedText}”
              </Alert>
            )}
            <TextField
              autoFocus
              fullWidth
              label="Not"
              minRows={4}
              multiline
              onChange={(event) => setEditText(event.target.value)}
              value={editText}
            />
            <TextField
              fullWidth
              label="Vurgu rengi"
              onChange={(event) => setEditColor(Number(event.target.value) as MaterialHighlightColor)}
              select
              value={editColor}
            >
              {highlightColorOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              helperText="Örnek: Sınav hazırlığı, Önemli notlar"
              label="Klasör"
              onChange={(event) => setEditFolder(event.target.value)}
              slotProps={{ htmlInput: { maxLength: 80 } }}
              value={editFolder}
            />
            <TextField
              fullWidth
              helperText="Virgülle ayır. En fazla 12 etiket."
              label="Etiketler"
              onChange={(event) => setEditTags(event.target.value)}
              placeholder="önemli, ezberle, sınavda çıkar"
              value={editTags}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={updateMutation.isPending} onClick={() => setEditingNote(null)}>
            Vazgeç
          </Button>
          <Button
            disabled={!editText.trim() || updateMutation.isPending}
            onClick={() => updateMutation.mutate()}
            variant="contained"
          >
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        onClose={() => !deleteMutation.isPending && setDeleteTarget(null)}
        open={Boolean(deleteTarget)}
      >
        <DialogTitle>Not silinsin mi?</DialogTitle>
        <DialogContent>
          <Typography>
            “{deleteTarget?.note}” notu kalıcı olarak silinecek. Bu işlem geri alınamaz.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button disabled={deleteMutation.isPending} onClick={() => setDeleteTarget(null)}>
            Vazgeç
          </Button>
          <Button
            color="error"
            disabled={!deleteTarget || deleteMutation.isPending}
            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
            variant="contained"
          >
            Sil
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        fullWidth
        maxWidth="sm"
        onClose={() => !bulkMutation.isPending && setBulkOrganizeOpen(false)}
        open={bulkOrganizeOpen}
      >
        <DialogTitle>{selectedIds.size} notu sınıflandır</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Alert severity="info">
              Girilen klasör ve etiketler seçili notların mevcut sınıflandırmasının yerini alır.
            </Alert>
            <TextField
              helperText="Boş bırakırsan klasör kaldırılır."
              label="Klasör"
              onChange={(event) => setBulkFolder(event.target.value)}
              slotProps={{ htmlInput: { maxLength: 80 } }}
              value={bulkFolder}
            />
            <TextField
              helperText="Virgülle ayır. Boş bırakırsan etiketler kaldırılır."
              label="Etiketler"
              onChange={(event) => setBulkTags(event.target.value)}
              placeholder="önemli, ezberle, sınavda çıkar"
              value={bulkTags}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={bulkMutation.isPending} onClick={() => setBulkOrganizeOpen(false)}>
            Vazgeç
          </Button>
          <Button
            disabled={bulkMutation.isPending}
            onClick={() => bulkMutation.mutate({
              action: 'organize',
              folder: bulkFolder,
              tags: parseTagInput(bulkTags),
            })}
            variant="contained"
          >
            Uygula
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        onClose={() => !bulkMutation.isPending && setBulkDeleteOpen(false)}
        open={bulkDeleteOpen}
      >
        <DialogTitle>{selectedIds.size} not silinsin mi?</DialogTitle>
        <DialogContent>
          <Typography>
            Seçili notlar kalıcı olarak silinecek. Bu işlem geri alınamaz.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button disabled={bulkMutation.isPending} onClick={() => setBulkDeleteOpen(false)}>
            Vazgeç
          </Button>
          <Button
            color="error"
            disabled={bulkMutation.isPending}
            onClick={() => bulkMutation.mutate({ action: 'delete' })}
            variant="contained"
          >
            Tümünü sil
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

const highlightColorOptions = [
  { value: MaterialHighlightColor.Yellow, label: 'Sarı' },
  { value: MaterialHighlightColor.Green, label: 'Yeşil' },
  { value: MaterialHighlightColor.Blue, label: 'Mavi' },
  { value: MaterialHighlightColor.Pink, label: 'Pembe' },
] as const

interface InsightCount {
  label: string
  count: number
}

interface NoteInsights {
  uniqueCourseCount: number
  uniqueMaterialCount: number
  uniquePageCount: number
  recentCount: number
  favoriteCount: number
  reviewCount: number
  organizedPercentage: number
  reviewPercentage: number
  topMaterials: InsightCount[]
  topCourses: InsightCount[]
  topTags: InsightCount[]
  colorCounts: { color: MaterialHighlightColor; count: number }[]
}

function ActionGroup({
  children,
  description,
  title,
}: {
  children: ReactNode
  description: string
  title: string
}) {
  return (
    <Box
      sx={{
        bgcolor: 'action.hover',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2.5,
        minWidth: 0,
        p: 1.5,
      }}
    >
      <Stack
        direction={{ sm: 'row', xs: 'column' }}
        spacing={1}
        sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', mb: 1.25 }}
      >
        <Typography sx={{ fontWeight: 900 }} variant="body2">{title}</Typography>
        <Chip label={description} size="small" variant="outlined" />
      </Stack>
      <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', rowGap: 0.75 }}>
        {children}
      </Stack>
    </Box>
  )
}

function InsightMetric({
  detail,
  label,
  value,
}: {
  detail: string
  label: string
  value: string
}) {
  return (
    <Box sx={{ bgcolor: 'action.hover', borderRadius: 2.5, p: 2 }}>
      <Typography color="text.secondary" sx={{ fontSize: 12, fontWeight: 800 }}>
        {label.toLocaleUpperCase('tr-TR')}
      </Typography>
      <Typography sx={{ fontSize: 30, fontWeight: 900, lineHeight: 1.2, mt: 0.5 }}>{value}</Typography>
      <Typography color="text.secondary" variant="body2">{detail}</Typography>
    </Box>
  )
}

function InsightRanking({
  emptyText,
  items,
  title,
}: {
  emptyText: string
  items: InsightCount[]
  title: string
}) {
  const maximum = Math.max(1, ...items.map((item) => item.count))

  return (
    <Box>
      <Typography sx={{ fontWeight: 900, mb: 1.25 }}>{title}</Typography>
      {items.length === 0 ? (
        <Typography color="text.secondary" variant="body2">{emptyText}</Typography>
      ) : (
        <Stack spacing={1.25}>
          {items.map((item) => (
            <Box key={item.label}>
              <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between' }}>
                <Typography noWrap sx={{ fontWeight: 700, maxWidth: '80%' }} variant="body2">
                  {item.label}
                </Typography>
                <Typography color="text.secondary" variant="body2">{item.count}</Typography>
              </Stack>
              <LinearProgress
                sx={{ borderRadius: 999, height: 7, mt: 0.75 }}
                value={(item.count / maximum) * 100}
                variant="determinate"
              />
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  )
}

function InsightProgress({ label, value }: { label: string; value: number }) {
  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between' }}>
        <Typography sx={{ fontWeight: 800 }} variant="body2">{label}</Typography>
        <Typography color="text.secondary" variant="body2">%{value}</Typography>
      </Stack>
      <LinearProgress
        sx={{ borderRadius: 999, height: 8, mt: 0.75 }}
        value={value}
        variant="determinate"
      />
    </Box>
  )
}

function buildNoteInsights(notes: MyMaterialNote[]): NoteInsights {
  const recentBoundary = Date.now() - (7 * 24 * 60 * 60 * 1000)
  const favoriteCount = notes.filter((note) => note.isFavorite).length
  const reviewCount = notes.filter((note) => note.isInReview).length
  const organizedCount = notes.filter((note) => Boolean(note.folderName) || note.tags.length > 0).length

  return {
    uniqueCourseCount: new Set(notes.map((note) => note.courseId)).size,
    uniqueMaterialCount: new Set(notes.map((note) => note.materialId)).size,
    uniquePageCount: new Set(notes.map((note) => `${note.materialId}:${note.pageNumber}`)).size,
    recentCount: notes.filter((note) =>
      new Date(note.updatedAt ?? note.createdAt).getTime() >= recentBoundary).length,
    favoriteCount,
    reviewCount,
    organizedPercentage: percentage(organizedCount, notes.length),
    reviewPercentage: percentage(reviewCount, notes.length),
    topMaterials: countTopItems(notes.map((note) => note.materialTitle), 5),
    topCourses: countTopItems(notes.map((note) => note.courseName), 5),
    topTags: countTopItems(notes.flatMap((note) => note.tags), 6),
    colorCounts: highlightColorOptions
      .map((option) => ({
        color: option.value,
        count: notes.filter((note) => note.highlightColor === option.value).length,
      }))
      .filter((item) => item.count > 0),
  }
}

function countTopItems(values: string[], take: number): InsightCount[] {
  const counts = new Map<string, number>()
  values.filter(Boolean).forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1))

  return Array.from(counts, ([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label, 'tr'))
    .slice(0, take)
}

function percentage(count: number, total: number) {
  return total === 0 ? 0 : Math.round((count / total) * 100)
}

function readFavoriteIds() {
  try {
    const value = localStorage.getItem(favoriteStorageKey)
    if (!value) return new Set<string>()
    const parsed = JSON.parse(value)
    return new Set<string>(Array.isArray(parsed) ? parsed : [])
  } catch {
    return new Set<string>()
  }
}

function highlightBackground(color: MaterialHighlightColor) {
  switch (color) {
    case MaterialHighlightColor.Green:
      return 'rgba(34,197,94,0.16)'
    case MaterialHighlightColor.Blue:
      return 'rgba(59,130,246,0.14)'
    case MaterialHighlightColor.Pink:
      return 'rgba(236,72,153,0.14)'
    default:
      return 'rgba(250,204,21,0.22)'
  }
}

function highlightColorLabel(color: MaterialHighlightColor) {
  return highlightColorOptions.find((option) => option.value === color)?.label ?? 'Sarı'
}

function parseTagInput(value: string) {
  return Array.from(
    new Map(
      value
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 12)
        .map((tag) => [tag.toLocaleLowerCase('tr'), tag]),
    ).values(),
  )
}

function normalizeSearchText(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('tr-TR')
}

function buildMarkdownExport(notes: MyMaterialNote[]) {
  const sections = notes.map((note, index) => {
    const metadata = [
      `- Ders: ${note.courseName}`,
      `- PDF: ${note.materialTitle}`,
      `- Sayfa: ${note.pageNumber}`,
      `- Tarih: ${formatDate(note.updatedAt ?? note.createdAt)}`,
      note.folderName ? `- Klasör: ${note.folderName}` : '',
      note.tags.length > 0 ? `- Etiketler: ${note.tags.map((tag) => `#${tag}`).join(', ')}` : '',
      `- Vurgu: ${highlightColorLabel(note.highlightColor)}`,
      `- PDF bağlantısı: ${window.location.origin}/materials/viewer/${note.materialId}?page=${note.pageNumber}&noteId=${note.id}`,
    ].filter(Boolean).join('\n')

    return [
      `## ${index + 1}. ${escapeMarkdown(note.materialTitle)} — Sayfa ${note.pageNumber}`,
      '',
      metadata,
      note.selectedText ? `\n> ${escapeMarkdown(note.selectedText).replace(/\n/g, '\n> ')}` : '',
      '',
      escapeMarkdown(note.note),
    ].filter((part) => part !== '').join('\n')
  })

  return [
    '# SPK Akademi — Notlarım',
    '',
    `Dışa aktarma tarihi: ${new Date().toLocaleString('tr-TR')}`,
    `Toplam not: ${notes.length}`,
    '',
    ...sections.flatMap((section) => [section, '\n---\n']),
  ].join('\n')
}

function buildWordExport(notes: MyMaterialNote[]) {
  return `\uFEFF<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <title>SPK Akademi - Notlarım</title>
  <style>${exportDocumentStyles()}</style>
</head>
<body>
  ${buildExportBody(notes)}
</body>
</html>`
}

function buildPrintableExport(notes: MyMaterialNote[]) {
  return `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <title>SPK Akademi - Notlarım</title>
  <style>${exportDocumentStyles()} @page { size: A4; margin: 16mm; }</style>
</head>
<body onload="window.focus(); window.print()">
  ${buildExportBody(notes)}
</body>
</html>`
}

function buildExportBody(notes: MyMaterialNote[]) {
  return `
    <header>
      <h1>SPK Akademi — Notlarım</h1>
      <p>Dışa aktarma: ${escapeHtml(new Date().toLocaleString('tr-TR'))} · ${notes.length} not</p>
    </header>
    ${notes.map((note, index) => `
      <article>
        <h2>${index + 1}. ${escapeHtml(note.materialTitle)}</h2>
        <div class="meta">
          <span>${escapeHtml(note.courseName)}</span>
          <span>Sayfa ${note.pageNumber}</span>
          <span>${escapeHtml(formatDate(note.updatedAt ?? note.createdAt))}</span>
          ${note.folderName ? `<span>Klasör: ${escapeHtml(note.folderName)}</span>` : ''}
          <span>Vurgu: ${escapeHtml(highlightColorLabel(note.highlightColor))}</span>
        </div>
        ${note.tags.length > 0 ? `<div class="tags">${note.tags.map((tag) => `<span>#${escapeHtml(tag)}</span>`).join('')}</div>` : ''}
        ${note.selectedText ? `<blockquote>${escapeHtml(note.selectedText)}</blockquote>` : ''}
        <div class="note">${escapeHtml(note.note).replace(/\n/g, '<br>')}</div>
        <p class="link">${escapeHtml(`${window.location.origin}/materials/viewer/${note.materialId}?page=${note.pageNumber}&noteId=${note.id}`)}</p>
      </article>
    `).join('')}
  `
}

function exportDocumentStyles() {
  return `
    body { color: #17202a; font-family: Arial, sans-serif; line-height: 1.55; margin: 32px; }
    header { border-bottom: 2px solid #0f766e; margin-bottom: 24px; padding-bottom: 12px; }
    h1 { color: #0f766e; font-size: 26px; margin: 0 0 8px; }
    h2 { font-size: 18px; margin: 0 0 10px; }
    article { break-inside: avoid; border-bottom: 1px solid #dbe3ea; margin-bottom: 24px; padding-bottom: 20px; }
    .meta, .tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
    .meta span, .tags span { background: #eef6f5; border-radius: 12px; font-size: 12px; padding: 3px 8px; }
    blockquote { border-left: 4px solid #d6a800; color: #475569; margin: 14px 0; padding: 8px 14px; }
    .note { font-size: 15px; }
    .link { color: #64748b; font-size: 10px; overflow-wrap: anywhere; }
  `
}

function downloadTextFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function buildExportFileName(extension: string) {
  const date = new Date().toISOString().slice(0, 10)
  return `spk-akademi-notlarim-${date}.${extension}`
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function escapeMarkdown(value: string) {
  return value.replace(/([\\`*_{}[\]()#+\-.!>])/g, '\\$1')
}

function formatDate(value?: string | null) {
  if (!value) return '-'

  return new Date(value).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
