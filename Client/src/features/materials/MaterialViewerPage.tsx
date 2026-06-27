import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import BookmarkAddOutlinedIcon from '@mui/icons-material/BookmarkAddOutlined'
import NavigateBeforeOutlinedIcon from '@mui/icons-material/NavigateBeforeOutlined'
import NavigateNextOutlinedIcon from '@mui/icons-material/NavigateNextOutlined'
import NoteAddOutlinedIcon from '@mui/icons-material/NoteAddOutlined'
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { MaterialHighlightColor, UserPdfViewPreference, type MaterialNote } from '../../models'
import { settingsApi } from '../../shared/api'
import {
  useCreateMaterialBookmark,
  useCreateMaterialNote,
  useMaterialBookmarks,
  useMaterialExtractedText,
  useMaterialNotes,
  useMaterialViewerInfo,
  useSaveMaterialProgress,
} from './hooks/useMaterialViewerQueries'

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()

const highlightColorCss: Record<MaterialHighlightColor, string> = {
  [MaterialHighlightColor.Yellow]: 'rgba(250, 204, 21, 0.35)',
  [MaterialHighlightColor.Green]: 'rgba(34, 197, 94, 0.28)',
  [MaterialHighlightColor.Blue]: 'rgba(59, 130, 246, 0.25)',
  [MaterialHighlightColor.Pink]: 'rgba(236, 72, 153, 0.25)',
}

type ViewerMode = 'pdf' | 'text' | 'split'

export function MaterialViewerPage() {
  const { materialId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedPage = Number(searchParams.get('page') ?? '')
  const requestedNoteId = searchParams.get('noteId')
  const containerRef = useRef<HTMLDivElement | null>(null)
  const pageElementRef = useRef<HTMLDivElement | null>(null)
  const pageRef = useRef(1)
  const lastTickAtRef = useRef(Date.now())
  const pendingFocusRef = useRef<{ noteId: string; selectedText: string } | null>(null)
  const handledNoteIdRef = useRef<string | null>(null)

  const [numPages, setNumPages] = useState(0)
  const [page, setPage] = useState(1)
  const [scale, setScale] = useState(1.25)
  const [viewerMode, setViewerMode] = useState<ViewerMode>('pdf')
  const [viewerModeInitialized, setViewerModeInitialized] = useState(false)
  const [textSearch, setTextSearch] = useState('')
  const [pdfError, setPdfError] = useState('')
  const [noteText, setNoteText] = useState('')
  const [noteFolder, setNoteFolder] = useState('')
  const [noteTags, setNoteTags] = useState('')
  const [selectedText, setSelectedText] = useState<string | null>(null)
  const [highlightColor, setHighlightColor] = useState<MaterialHighlightColor>(MaterialHighlightColor.Yellow)

  const viewerQuery = useMaterialViewerInfo(materialId)
  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.get,
    staleTime: 300_000,
  })
  const extractedTextQuery = useMaterialExtractedText(materialId, viewerMode !== 'pdf')
  const notesQuery = useMaterialNotes(materialId)
  const bookmarksQuery = useMaterialBookmarks(materialId)

  const focusPendingSelection = useCallback(() => {
    const pending = pendingFocusRef.current
    const pageElement = pageElementRef.current
    if (!pending || !pageElement) {
      return
    }

    const spans = Array.from(
      pageElement.querySelectorAll<HTMLSpanElement>('.react-pdf__Page__textContent span'),
    )
    const match = findTextLayerMatch(spans, pending.selectedText)
    if (!match) {
      return
    }

    pageElement.querySelectorAll<HTMLElement>('[data-note-focus="true"]').forEach(clearFocusedSpan)
    match.forEach((span) => {
      span.dataset.noteFocus = 'true'
      span.style.backgroundColor = 'rgba(250, 204, 21, 0.48)'
      span.style.borderRadius = '3px'
      span.style.boxShadow = '0 0 0 2px rgba(245, 158, 11, 0.85)'
      span.style.zIndex = '2'
    })

    pendingFocusRef.current = null
    match[0]?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
    window.setTimeout(() => match.forEach(clearFocusedSpan), 4500)
  }, [])

  useEffect(() => {
    const onContextMenu = (e: MouseEvent) => e.preventDefault()
    window.addEventListener('contextmenu', onContextMenu)
    return () => window.removeEventListener('contextmenu', onContextMenu)
  }, [])

  useEffect(() => {
    if (!settingsQuery.data || viewerModeInitialized) return
    setViewerMode(
      settingsQuery.data.preferredPdfView === UserPdfViewPreference.Text
        ? 'text'
        : settingsQuery.data.preferredPdfView === UserPdfViewPreference.Split
          ? 'split'
          : 'pdf',
    )
    setViewerModeInitialized(true)
  }, [settingsQuery.data, viewerModeInitialized])

  useEffect(() => {
    if (!viewerQuery.data) return
    if (Number.isFinite(requestedPage) && requestedPage > 0) {
      setPage(Math.min(Math.max(1, requestedPage), Math.max(1, viewerQuery.data.pageCount || requestedPage)))
      return
    }
    if (settingsQuery.data?.rememberLastPdfPage === false) {
      setPage(1)
      return
    }
    if (viewerQuery.data.resumePage && viewerQuery.data.resumePage > 0) {
      setPage(viewerQuery.data.resumePage)
    }
  }, [requestedPage, settingsQuery.data?.rememberLastPdfPage, viewerQuery.data])

  useEffect(() => {
    if (!requestedNoteId || handledNoteIdRef.current === requestedNoteId || !notesQuery.data) {
      return
    }

    const note = notesQuery.data.find((item) => item.id === requestedNoteId)
    if (!note) {
      return
    }

    handledNoteIdRef.current = requestedNoteId
    pendingFocusRef.current = note.selectedText
      ? { noteId: note.id, selectedText: note.selectedText }
      : null
    setViewerMode('pdf')
    setPage(note.pageNumber)
  }, [notesQuery.data, requestedNoteId])

  const { mutate: saveProgress } = useSaveMaterialProgress(materialId, numPages)

  const tickProgress = useCallback(() => {
    const now = Date.now()
    const seconds = Math.max(0, Math.floor((now - lastTickAtRef.current) / 1000))
    lastTickAtRef.current = now
    if (!materialId || seconds === 0 || numPages === 0) return
    saveProgress({ lastPage: pageRef.current, secondsReadDelta: seconds })
  }, [materialId, numPages, saveProgress])

  useEffect(() => {
    const interval = window.setInterval(() => tickProgress(), 15000)
    return () => window.clearInterval(interval)
  }, [tickProgress])

  useEffect(() => {
    // save on page change (debounced-ish)
    if (!materialId || numPages === 0) return
    const handle = window.setTimeout(() => {
      saveProgress({ lastPage: page, secondsReadDelta: 0 })
    }, 900)
    return () => window.clearTimeout(handle)
  }, [materialId, numPages, page, saveProgress])

  useEffect(() => {
    pageRef.current = page
    containerRef.current?.scrollTo({ left: 0, top: 0, behavior: 'smooth' })
  }, [page])

  const createBookmarkMutation = useCreateMaterialBookmark(materialId, page)
  const noteDraftKey = useMemo(() => (materialId ? `material-note-draft:${materialId}:${page}` : ''), [materialId, page])

  useEffect(() => {
    if (!settingsQuery.data?.autoSaveNotes || !noteDraftKey || noteText.trim()) {
      return
    }

    const draft = window.localStorage.getItem(noteDraftKey)
    if (draft) {
      setNoteText(draft)
    }
  }, [noteDraftKey, noteText, settingsQuery.data?.autoSaveNotes])

  useEffect(() => {
    if (!noteDraftKey) {
      return
    }

    if (settingsQuery.data?.autoSaveNotes === false) {
      window.localStorage.removeItem(noteDraftKey)
      return
    }

    const handle = window.setTimeout(() => {
      const trimmed = noteText.trim()
      if (trimmed) {
        window.localStorage.setItem(noteDraftKey, noteText)
      } else {
        window.localStorage.removeItem(noteDraftKey)
      }
    }, 450)

    return () => window.clearTimeout(handle)
  }, [noteDraftKey, noteText, settingsQuery.data?.autoSaveNotes])

  const createNoteMutation = useCreateMaterialNote({
    folderName: noteFolder,
    materialId,
    page,
    selectedText,
    tags: parseTagInput(noteTags),
    noteText,
    highlightColor,
    onSaved: () => {
      if (noteDraftKey) {
        window.localStorage.removeItem(noteDraftKey)
      }
      setNoteText('')
      setNoteFolder('')
      setNoteTags('')
      setSelectedText(null)
    },
  })

  const extractedPages = useMemo(() => {
    const text = extractedTextQuery.data?.extractedText ?? ''
    if (!text.trim()) return []

    return text
      .split(/--- Page\s+(\d+)\s+---/g)
      .reduce<Array<{ pageNumber: number; text: string }>>((pages, part, index, parts) => {
        if (index % 2 === 1) {
          pages.push({
            pageNumber: Number(part),
            text: parts[index + 1]?.trim() ?? '',
          })
        }
        return pages
      }, [])
  }, [extractedTextQuery.data?.extractedText])

  const visibleExtractedPages = useMemo(() => {
    const query = textSearch.trim().toLowerCase()
    if (!query) {
      return extractedPages.filter((item) => item.pageNumber === page)
    }

    return extractedPages
      .filter((item) => item.text.toLowerCase().includes(query))
      .slice(0, 50)
  }, [extractedPages, page, textSearch])

  const pdfFileUrl = useMemo(() => {
    const streamUrl = viewerQuery.data?.streamUrl ?? ''
    if (!streamUrl || /^https?:\/\//i.test(streamUrl)) return streamUrl

    const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
    return `${apiBaseUrl}${streamUrl}`
  }, [viewerQuery.data?.streamUrl])

  useEffect(() => {
    setPdfError('')
  }, [pdfFileUrl])

  const highlightPhrasesForPage = useMemo(() => {
    if (settingsQuery.data?.showHighlights === false) {
      return []
    }

    const notes = notesQuery.data ?? []
    return notes
      .filter((n) => n.pageNumber === page && n.selectedText && n.selectedText.trim().length >= 3)
      .map((n) => ({ text: n.selectedText as string, color: n.highlightColor }))
  }, [notesQuery.data, page, settingsQuery.data?.showHighlights])

  const customTextRenderer = useCallback(
    ({ str }: { str: string }) => {
      if (highlightPhrasesForPage.length === 0) return str

      let html = str
      for (const highlight of highlightPhrasesForPage) {
        const safe = highlight.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const regex = new RegExp(safe, 'g')
        html = html.replace(regex, (match) => {
          const bg = highlightColorCss[highlight.color]
          return `<mark style="background:${bg};padding:0 1px;border-radius:3px">${match}</mark>`
        })
      }
      return html
    },
    [highlightPhrasesForPage],
  )

  function onMouseUpCapture() {
    const selection = window.getSelection()?.toString() ?? ''
    const text = selection.trim()
    if (text.length >= 3 && text.length <= 1200) {
      setSelectedText(text)
    }
  }

  function goToPage(nextPage: number) {
    setPage(Math.min(Math.max(1, nextPage), Math.max(1, numPages || viewerQuery.data?.pageCount || 1)))
  }

  function goToSavedItem(nextPage: number, note?: MaterialNote) {
    const targetPage = Math.min(
      Math.max(1, nextPage),
      Math.max(1, numPages || viewerQuery.data?.pageCount || 1),
    )

    setViewerMode('pdf')
    pendingFocusRef.current = note?.selectedText
      ? { noteId: note.id, selectedText: note.selectedText }
      : null
    setPage(targetPage)
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      next.set('page', String(targetPage))
      if (note) {
        next.set('noteId', note.id)
      } else {
        next.delete('noteId')
      }
      return next
    }, { replace: true })

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        containerRef.current?.focus({ preventScroll: true })
        focusPendingSelection()
      })
    })
  }

  if (!materialId) {
    return <Alert severity="error">MaterialId bulunamadı.</Alert>
  }

  if (viewerQuery.isLoading) {
    return (
      <Stack spacing={2}>
        <Skeleton height={160} variant="rounded" />
        <Skeleton height={520} variant="rounded" />
      </Stack>
    )
  }

  if (viewerQuery.isError) {
    return (
      <Alert severity="error">
        {viewerQuery.error instanceof Error ? viewerQuery.error.message : 'PDF görüntüleyici yüklenemedi.'}
      </Alert>
    )
  }

  const viewer = viewerQuery.data
  if (!viewer) {
    return <Alert severity="error">PDF görüntüleyici verisi alınamadı.</Alert>
  }

  return (
    <Stack spacing={2.5}>
      <Paper sx={{ borderRadius: 3, p: 2.5 }} variant="outlined">
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between' }}>
          <Box>
            <Typography sx={{ fontWeight: 900 }} variant="h6">
              {viewer.title}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', mt: 1 }}>
              <Chip color="primary" label={`${page}/${Math.max(numPages, viewer.pageCount || 0)} sayfa`} />
              <Chip label={`${viewer.progressPercentage ?? 0}%`} variant="outlined" />
              {selectedText && <Chip color="warning" label="Metin seçildi" size="small" />}
            </Stack>
          </Box>

          <Stack direction="row" spacing={1}>
            <IconButton disabled={page <= 1} onClick={() => goToPage(page - 1)}>
              <NavigateBeforeOutlinedIcon />
            </IconButton>
            <IconButton
              disabled={page >= Math.max(1, numPages || viewer.pageCount || 1)}
              onClick={() => goToPage(page + 1)}
            >
              <NavigateNextOutlinedIcon />
            </IconButton>
            <Button
              onClick={() => createBookmarkMutation.mutate()}
              startIcon={<BookmarkAddOutlinedIcon />}
              variant="outlined"
            >
              Bookmark Ekle
            </Button>
          </Stack>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Tabs
          onChange={(_, value: ViewerMode) => setViewerMode(value)}
          sx={{ mb: 2 }}
          value={viewerMode}
        >
          <Tab icon={<PictureAsPdfOutlinedIcon />} iconPosition="start" label="Orijinal PDF" value="pdf" />
          <Tab icon={<ArticleOutlinedIcon />} iconPosition="start" label="Metin" value="text" />
          <Tab icon={<ArticleOutlinedIcon />} iconPosition="start" label="Bölünmüş" value="split" />
        </Tabs>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { md: 'center' } }}>
          {viewerMode !== 'text' && (
            <>
              <TextField
                label="Sayfa"
                type="number"
                value={page}
                onChange={(e) => goToPage(Number(e.target.value))}
                sx={{ width: 140 }}
                slotProps={{ htmlInput: { min: 1, max: Math.max(1, numPages || viewer.pageCount || 1) } }}
              />
              <TextField
                label="Zoom"
                type="number"
                value={scale}
                onChange={(e) => setScale(Math.max(0.6, Math.min(2.2, Number(e.target.value))))}
                sx={{ width: 140 }}
                slotProps={{ htmlInput: { min: 0.6, max: 2.2, step: 0.1 } }}
              />
              <Button onClick={() => containerRef.current?.requestFullscreen?.()} variant="outlined">
                Fullscreen
              </Button>
            </>
          )}
          {viewerMode !== 'pdf' && (
            <TextField
              fullWidth
              label="Metinde ara"
              onChange={(e) => setTextSearch(e.target.value)}
              value={textSearch}
            />
          )}
          <Button onClick={() => tickProgress()} variant="outlined">
            Kaldığım Yeri Kaydet
          </Button>
        </Stack>
      </Paper>

      <Box
        sx={{
          display: 'grid',
          gap: 2.5,
          gridTemplateColumns: { lg: viewerMode === 'split' ? '1fr 1fr' : '1.7fr 1fr', xs: '1fr' },
        }}
      >
        <Paper
          ref={containerRef}
          tabIndex={-1}
          onMouseUpCapture={onMouseUpCapture}
          sx={{
            borderRadius: 3,
            display: viewerMode === 'text' ? 'none' : 'block',
            maxHeight: { md: 'calc(100vh - 220px)', xs: '72vh' },
            overflow: 'auto',
            position: 'relative',
          }}
          variant="outlined"
        >
          {viewer.watermarkText && (
            <Box
              sx={{
                pointerEvents: 'none',
                position: 'absolute',
                inset: 0,
                opacity: 0.06,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: 'rotate(-25deg)',
                fontSize: { xs: 18, md: 28 },
                fontWeight: 900,
              }}
            >
              {viewer.watermarkText}
            </Box>
          )}

          <Box sx={{ alignItems: 'center', display: 'flex', flexDirection: 'column', gap: 2, minWidth: 'max-content', p: 2 }}>
            <Document
              file={pdfFileUrl}
              loading={<Skeleton height={520} variant="rounded" />}
              onLoadSuccess={(info) => {
                setNumPages(info.numPages)
                setPage((current) => Math.min(Math.max(1, current), info.numPages))
              }}
              onLoadError={(error) => setPdfError(error.message || 'PDF dosyasi yuklenemedi.')}
              error={
                <Stack spacing={1.5} sx={{ maxWidth: 520, p: 2 }}>
                  <Alert severity="error">
                    {pdfError || 'PDF dosyasi yuklenemedi.'}
                  </Alert>
                  {pdfFileUrl && (
                    <Button component="a" href={pdfFileUrl} target="_blank" rel="noreferrer" variant="outlined">
                      PDF'i yeni sekmede ac
                    </Button>
                  )}
                </Stack>
              }
            >
              <Box sx={{ bgcolor: 'background.paper', boxShadow: '0 8px 24px rgba(15,23,42,0.10)' }}>
                <Page
                  inputRef={pageElementRef}
                  onRenderTextLayerSuccess={focusPendingSelection}
                  pageNumber={page}
                  renderAnnotationLayer
                  renderTextLayer
                  scale={scale}
                  customTextRenderer={customTextRenderer}
                  loading={<Skeleton height={520} variant="rounded" width={720} />}
                />
              </Box>
            </Document>
          </Box>
        </Paper>

        {viewerMode !== 'pdf' && (
          <Paper
            onMouseUpCapture={onMouseUpCapture}
            sx={{ borderRadius: 3, minHeight: 520, overflow: 'hidden', p: 2.5 }}
            variant="outlined"
          >
            {extractedTextQuery.isLoading ? (
              <Stack spacing={1.5}>
                <Skeleton height={34} variant="rounded" />
                <Skeleton height={260} variant="rounded" />
                <Skeleton height={180} variant="rounded" />
              </Stack>
            ) : extractedTextQuery.isError ? (
              <Alert severity="error">Metin gorunumu yuklenemedi.</Alert>
            ) : visibleExtractedPages.length === 0 ? (
              <Alert severity="info">Metin gorunumunde gosterilecek sonuc bulunamadi.</Alert>
            ) : (
              <Stack spacing={2}>
                {visibleExtractedPages.map((item) => (
                  <Paper key={item.pageNumber} sx={{ borderRadius: 2, p: 2 }} variant="outlined">
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography sx={{ fontWeight: 900 }}>Sayfa {item.pageNumber}</Typography>
                      <Button
                        onClick={() => {
                          setPage(item.pageNumber)
                          setViewerMode('pdf')
                        }}
                        size="small"
                        variant="outlined"
                      >
                        PDF'te ac
                      </Button>
                    </Stack>
                    <Typography
                      component="pre"
                      sx={{
                        color: 'text.secondary',
                        fontFamily: 'inherit',
                        fontSize: 14,
                        lineHeight: 1.8,
                        m: 0,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {item.text}
                    </Typography>
                  </Paper>
                ))}
              </Stack>
            )}
          </Paper>
        )}

        <Stack spacing={2.5} sx={viewerMode === 'split' ? { gridColumn: { lg: '1 / -1' } } : undefined}>
          <Paper sx={{ borderRadius: 3, p: 2.5 }} variant="outlined">
            <Typography sx={{ fontWeight: 900, mb: 1.5 }} variant="subtitle1">
              Not / Highlight
            </Typography>

            <Stack spacing={1.25}>
              {selectedText && (
                <Alert severity="info">
                  Seçili metin: <strong>{selectedText.slice(0, 120)}</strong>
                </Alert>
              )}

              <Select
                value={highlightColor}
                onChange={(e) => setHighlightColor(Number(e.target.value) as MaterialHighlightColor)}
                size="small"
              >
                <MenuItem value={MaterialHighlightColor.Yellow}>Yellow</MenuItem>
                <MenuItem value={MaterialHighlightColor.Green}>Green</MenuItem>
                <MenuItem value={MaterialHighlightColor.Blue}>Blue</MenuItem>
                <MenuItem value={MaterialHighlightColor.Pink}>Pink</MenuItem>
              </Select>

              <TextField
                label="Not"
                rows={3}
                multiline
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />

              <TextField
                label="Klasör"
                onChange={(e) => setNoteFolder(e.target.value)}
                placeholder="Örn. Sınav hazırlığı"
                size="small"
                value={noteFolder}
              />

              <TextField
                helperText="Virgülle ayır"
                label="Etiketler"
                onChange={(e) => setNoteTags(e.target.value)}
                placeholder="önemli, ezberle"
                size="small"
                value={noteTags}
              />

              <Button
                disabled={createNoteMutation.isPending || noteText.trim().length === 0}
                onClick={() => createNoteMutation.mutate()}
                startIcon={<NoteAddOutlinedIcon />}
                variant="contained"
              >
                Not Ekle
              </Button>
            </Stack>
          </Paper>

          <Paper sx={{ borderRadius: 3, p: 2.5 }} variant="outlined">
            <Typography sx={{ fontWeight: 900, mb: 1.5 }} variant="subtitle1">
              Bookmarks
            </Typography>
            {bookmarksQuery.isLoading ? (
              <Skeleton height={140} variant="rounded" />
            ) : bookmarksQuery.data?.length ? (
              <Stack spacing={1}>
                {bookmarksQuery.data.map((b) => (
                  <Button key={b.id} onClick={() => goToSavedItem(b.pageNumber)} variant="outlined">
                    {b.title} · {b.pageNumber}
                  </Button>
                ))}
              </Stack>
            ) : (
              <Typography color="text.secondary" variant="body2">
                Bookmark yok.
              </Typography>
            )}
          </Paper>

          <Paper sx={{ borderRadius: 3, p: 2.5 }} variant="outlined">
            <Typography sx={{ fontWeight: 900, mb: 1.5 }} variant="subtitle1">
              Notlar / Highlights
            </Typography>
            {notesQuery.isLoading ? (
              <Skeleton height={160} variant="rounded" />
            ) : notesQuery.data?.length ? (
              <Stack spacing={1.25}>
                {notesQuery.data.slice().reverse().slice(0, 12).map((n) => (
                  <Paper key={n.id} variant="outlined" sx={{ borderRadius: 2, p: 1.5 }}>
                    <Stack spacing={0.5}>
                      <Typography sx={{ fontWeight: 800 }} variant="body2">
                        Sayfa {n.pageNumber} · {MaterialHighlightColor[n.highlightColor]}
                      </Typography>
                      {(n.folderName || n.tags.length > 0) && (
                        <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap' }}>
                          {n.folderName && <Chip color="primary" label={n.folderName} size="small" variant="outlined" />}
                          {n.tags.map((tag) => <Chip key={tag} label={`#${tag}`} size="small" />)}
                        </Stack>
                      )}
                      {n.selectedText && (
                        <Typography color="text.secondary" variant="body2">
                          “{n.selectedText.length > 140 ? `${n.selectedText.slice(0, 140)}…` : n.selectedText}”
                        </Typography>
                      )}
                      <Typography variant="body2">{n.note}</Typography>
                      <Button onClick={() => goToSavedItem(n.pageNumber, n)} size="small">
                        Git
                      </Button>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Typography color="text.secondary" variant="body2">
                Not yok.
              </Typography>
            )}
          </Paper>
        </Stack>
      </Box>
    </Stack>
  )
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

function findTextLayerMatch(spans: HTMLSpanElement[], selectedText: string) {
  const target = normalizePdfText(selectedText)
  if (target.length < 3) {
    return null
  }

  const ranges: Array<{ span: HTMLSpanElement; start: number; end: number }> = []
  let combined = ''

  spans.forEach((span) => {
    const text = normalizePdfText(span.textContent ?? '')
    if (!text) {
      return
    }

    if (combined) {
      combined += ' '
    }
    const start = combined.length
    combined += text
    ranges.push({ span, start, end: combined.length })
  })

  let matchStart = combined.indexOf(target)
  let matchLength = target.length

  if (matchStart < 0) {
    const fallback = target.split(' ').slice(0, 8).join(' ')
    if (fallback.length >= 12) {
      matchStart = combined.indexOf(fallback)
      matchLength = fallback.length
    }
  }

  if (matchStart < 0) {
    return null
  }

  const matchEnd = matchStart + matchLength
  return ranges
    .filter((range) => range.end > matchStart && range.start < matchEnd)
    .map((range) => range.span)
}

function normalizePdfText(value: string) {
  return value.replace(/\s+/g, ' ').trim().toLocaleLowerCase('tr-TR')
}

function clearFocusedSpan(span: HTMLElement) {
  delete span.dataset.noteFocus
  span.style.backgroundColor = ''
  span.style.borderRadius = ''
  span.style.boxShadow = ''
  span.style.zIndex = ''
}

