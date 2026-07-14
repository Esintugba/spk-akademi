import { useCallback, useEffect, useMemo, useState } from 'react'
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined'
import DoNotDisturbOnOutlinedIcon from '@mui/icons-material/DoNotDisturbOnOutlined'
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined'
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import {
  ContentAccessLevel,
  ModerationContentType,
  ReviewStatus,
  type ModerateContentRequest,
  type ModerationHistoryItem,
  type ModerationItem,
} from '../../models'
import { api } from '../../shared/api'
import { AdminPageHero } from '../common/AdminPageHero'
import { AdminSurface } from '../common/AdminSurface'
import { EmptyState } from '../common/EmptyState'

const statusOptions = [
  { label: 'Draft', value: ReviewStatus.Draft },
  { label: 'Pending', value: ReviewStatus.PendingReview },
  { label: 'Approved', value: ReviewStatus.Approved },
  { label: 'Revizyon', value: ReviewStatus.NeedsRevision },
  { label: 'Rejected', value: ReviewStatus.Rejected },
]

const contentTypeLabels: Record<ModerationContentType, string> = {
  [ModerationContentType.Question]: 'Soru',
  [ModerationContentType.StudyNote]: 'Not',
  [ModerationContentType.SourceDocument]: 'PDF',
  [ModerationContentType.TrialExam]: 'Deneme',
}

const accessLabels: Record<ContentAccessLevel, string> = {
  [ContentAccessLevel.Free]: 'Free',
  [ContentAccessLevel.Trial]: 'Trial',
  [ContentAccessLevel.Premium]: 'Premium',
}

export function ModerationPage() {
  const [items, setItems] = useState<ModerationItem[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [contentType, setContentType] = useState<number | ''>('')
  const [appliedContentType, setAppliedContentType] = useState<number | ''>('')
  const [reviewStatus, setReviewStatus] = useState<number | ''>('')
  const [appliedReviewStatus, setAppliedReviewStatus] = useState<number | ''>('')
  const [fromDate, setFromDate] = useState('')
  const [appliedFromDate, setAppliedFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [appliedToDate, setAppliedToDate] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeItem, setActiveItem] = useState<ModerationItem | null>(null)
  const [history, setHistory] = useState<ModerationHistoryItem[]>([])
  const [reviewComment, setReviewComment] = useState('')
  const [nextStatus, setNextStatus] = useState<ReviewStatus>(ReviewStatus.Approved)
  const [nextAccessLevel, setNextAccessLevel] = useState<ContentAccessLevel>(ContentAccessLevel.Free)

  const loadItems = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await api.getModerationItems({
        contentType: appliedContentType || undefined,
        reviewStatus: appliedReviewStatus || undefined,
        search: appliedSearch || undefined,
        fromDate: appliedFromDate || undefined,
        toDate: appliedToDate || undefined,
        page: 1,
        pageSize: 100,
      })

      setItems(response.items)
      setSelectedIds([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Moderasyon kayıtları alınamadı.')
    } finally {
      setIsLoading(false)
    }
  }, [appliedContentType, appliedFromDate, appliedReviewStatus, appliedSearch, appliedToDate])

  useEffect(() => {
    void loadItems()
  }, [loadItems])

  function applyFilters() {
    if (fromDate && toDate && fromDate > toDate) {
      setError('Başlangıç tarihi bitiş tarihinden sonra olamaz.')
      return
    }

    setError('')
    setAppliedSearch(search.trim())
    setAppliedContentType(contentType)
    setAppliedReviewStatus(reviewStatus)
    setAppliedFromDate(fromDate)
    setAppliedToDate(toDate)
  }

  function resetFilters() {
    setSearch('')
    setContentType('')
    setReviewStatus('')
    setFromDate('')
    setToDate('')
    setAppliedSearch('')
    setAppliedContentType('')
    setAppliedReviewStatus('')
    setAppliedFromDate('')
    setAppliedToDate('')
    setError('')
  }

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.includes(getKey(item))),
    [items, selectedIds],
  )

  async function openReviewDialog(item: ModerationItem) {
    setActiveItem(item)
    setNextStatus(item.reviewStatus)
    setNextAccessLevel(item.accessLevel)
    setReviewComment(item.reviewComment || '')
    try {
      const response = await api.getModerationHistory(item.contentType, item.contentId)
      setHistory(response)
    } catch {
      setHistory([])
    }
  }

  async function submitReview() {
    if (!activeItem) {
      return
    }

    await api.moderateContent({
      contentType: activeItem.contentType,
      contentId: activeItem.contentId,
      reviewStatus: nextStatus,
      reviewComment,
      accessLevel: nextAccessLevel,
    })

    setActiveItem(null)
    await loadItems()
  }

  async function runBulkReview(reviewStatusValue: ReviewStatus) {
    const payload: ModerateContentRequest[] = selectedItems.map((item) => ({
      contentType: item.contentType,
      contentId: item.contentId,
      reviewStatus: reviewStatusValue,
      reviewComment: reviewComment || null,
      accessLevel: item.accessLevel,
    }))

    if (payload.length === 0) {
      return
    }

    await api.bulkModerateContent(payload)
    setReviewComment('')
    await loadItems()
  }

  function getKey(item: ModerationItem) {
    return `${item.contentType}:${item.contentId}`
  }

  function toggleSelection(item: ModerationItem) {
    const key = getKey(item)
    setSelectedIds((current) => current.includes(key) ? current.filter((value) => value !== key) : [...current, key])
  }

  return (
    <Stack spacing={3}>
      <AdminPageHero
        eyebrow="İçerik Moderasyonu"
        title="Draft, pending ve yayın sürecini tek ekranda yönetin."
        description="Sorular, notlar, PDF kaynakları ve denemeler için hızlı onay, red, revizyon ve bulk moderasyon akışı burada çalışır."
        actions={
          <>
            <Button startIcon={<RestartAltOutlinedIcon />} variant="outlined" onClick={() => void loadItems()}>
              Yenile
            </Button>
            <Button disabled={selectedItems.length === 0} startIcon={<CheckCircleOutlineOutlinedIcon />} variant="contained" onClick={() => void runBulkReview(ReviewStatus.Approved)}>
              Toplu onayla
            </Button>
          </>
        }
      />

      {error && <Alert severity="error">{error}</Alert>}

      <AdminSurface title="Filtreler ve toplu aksiyonlar">
        <Stack spacing={2.5}>
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { lg: 'minmax(280px, 2fr) repeat(2, minmax(180px, 1fr))', xs: '1fr' },
            }}
          >
            <TextField
              fullWidth
              label="Ara"
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  applyFilters()
                }
              }}
              value={search}
            />
            <FormControl fullWidth>
              <InputLabel>İçerik tipi</InputLabel>
              <Select label="İçerik tipi" value={contentType} onChange={(event) => setContentType(event.target.value as number | '')}>
                <MenuItem value="">Tümü</MenuItem>
                {Object.entries(contentTypeLabels).map(([value, label]) => (
                  <MenuItem key={value} value={Number(value)}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Durum</InputLabel>
              <Select label="Durum" value={reviewStatus} onChange={(event) => setReviewStatus(event.target.value as number | '')}>
                <MenuItem value="">Tümü</MenuItem>
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box
            sx={{
              alignItems: 'stretch',
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { md: 'minmax(200px, 1fr) minmax(200px, 1fr) auto', xs: '1fr' },
            }}
          >
            <TextField
              fullWidth
              label="Başlangıç tarihi"
              onChange={(event) => setFromDate(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              type="date"
              value={fromDate}
            />
            <TextField
              fullWidth
              label="Bitiş tarihi"
              onChange={(event) => setToDate(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              type="date"
              value={toDate}
            />
            <Stack direction="row" spacing={1.25} sx={{ alignItems: 'stretch', justifyContent: { md: 'flex-end', xs: 'stretch' } }}>
              <Button onClick={resetFilters} startIcon={<RestartAltOutlinedIcon />} sx={{ minHeight: 56, whiteSpace: 'nowrap' }} variant="text">
                Temizle
              </Button>
              <Button onClick={applyFilters} sx={{ minHeight: 56, minWidth: 120, whiteSpace: 'nowrap' }} variant="contained">
                Uygula
              </Button>
            </Stack>
          </Box>

          <Typography color="text.secondary" variant="caption">
            Tarih aralığı kayıtların son işlem zamanına göre uygulanır ve bitiş günü filtreye dahildir.
          </Typography>

          <Stack
            spacing={1.5}
            sx={{ borderTop: '1px solid rgba(148,163,184,0.18)', pt: 2.5 }}
          >
            <TextField
              fullWidth
              label="Toplu moderasyon notu"
              value={reviewComment}
              onChange={(event) => setReviewComment(event.target.value)}
            />
            <Box
              sx={{
                display: 'grid',
                gap: 1.25,
                gridTemplateColumns: { md: 'repeat(3, minmax(180px, 1fr))', xs: '1fr' },
              }}
            >
              <Button disabled={selectedItems.length === 0} color="success" startIcon={<CheckCircleOutlineOutlinedIcon />} sx={{ minHeight: 48, whiteSpace: 'nowrap' }} variant="contained" onClick={() => void runBulkReview(ReviewStatus.Approved)}>
                Onayla ({selectedItems.length})
              </Button>
              <Button disabled={selectedItems.length === 0} color="warning" startIcon={<RateReviewOutlinedIcon />} sx={{ minHeight: 48, whiteSpace: 'nowrap' }} variant="outlined" onClick={() => void runBulkReview(ReviewStatus.NeedsRevision)}>
                Revizyona gönder
              </Button>
              <Button disabled={selectedItems.length === 0} color="error" startIcon={<DoNotDisturbOnOutlinedIcon />} sx={{ minHeight: 48, whiteSpace: 'nowrap' }} variant="outlined" onClick={() => void runBulkReview(ReviewStatus.Rejected)}>
                Reddet
              </Button>
            </Box>
          </Stack>
        </Stack>
      </AdminSurface>

      <AdminSurface title="Moderasyon kuyruğu">
        {isLoading ? (
          <Typography color="text.secondary">Yükleniyor...</Typography>
        ) : items.length === 0 ? (
          <EmptyState title="Moderasyon öğesi yok" description="Filtreleri değiştirerek farklı durumdaki içerikleri görebilirsin." />
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 960 }}>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={items.length > 0 && selectedIds.length === items.length}
                    indeterminate={selectedIds.length > 0 && selectedIds.length < items.length}
                    onChange={(_, checked) => setSelectedIds(checked ? items.map(getKey) : [])}
                  />
                </TableCell>
                <TableCell>İçerik</TableCell>
                <TableCell>Tip</TableCell>
                <TableCell>Durum</TableCell>
                <TableCell>Erişim</TableCell>
                <TableCell>Son işlem</TableCell>
                <TableCell>İnceleyen</TableCell>
                <TableCell align="right">İşlem</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow hover key={getKey(item)}>
                  <TableCell padding="checkbox">
                    <Checkbox checked={selectedIds.includes(getKey(item))} onChange={() => toggleSelection(item)} />
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 700 }}>{item.title}</Typography>
                    <Typography color="text.secondary" sx={{ fontSize: 12 }}>
                      {item.subtitle || 'Ek bilgi yok'}
                    </Typography>
                  </TableCell>
                  <TableCell>{contentTypeLabels[item.contentType]}</TableCell>
                  <TableCell>
                    <Chip label={statusOptions.find((option) => option.value === item.reviewStatus)?.label || item.reviewStatus} size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip color="primary" label={accessLabels[item.accessLevel]} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <Typography sx={{ fontSize: 13 }}>
                      {new Date(item.updatedAt || item.createdAt).toLocaleString('tr-TR')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: 13 }}>{item.reviewedBy || '-'}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" variant="outlined" onClick={() => void openReviewDialog(item)}>
                      İncele
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </Box>
        )}
      </AdminSurface>

      <Dialog fullWidth maxWidth="md" open={Boolean(activeItem)} onClose={() => setActiveItem(null)}>
        <DialogTitle>Moderasyon incelemesi</DialogTitle>
        <DialogContent>
          {activeItem && (
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Typography sx={{ fontWeight: 800 }}>{activeItem.title}</Typography>
              <Typography color="text.secondary">{activeItem.subtitle || 'Ek açıklama yok'}</Typography>
              <Stack direction={{ md: 'row', xs: 'column' }} spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>Yeni durum</InputLabel>
                  <Select label="Yeni durum" value={nextStatus} onChange={(event) => setNextStatus(event.target.value as ReviewStatus)}>
                    {statusOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Erişim seviyesi</InputLabel>
                  <Select label="Erişim seviyesi" value={nextAccessLevel} onChange={(event) => setNextAccessLevel(event.target.value as ContentAccessLevel)}>
                    {Object.entries(accessLabels).map(([value, label]) => (
                      <MenuItem key={value} value={Number(value)}>
                        {label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
              <TextField
                fullWidth
                label="Moderasyon notu"
                rows={4}
                multiline
                value={reviewComment}
                onChange={(event) => setReviewComment(event.target.value)}
              />
              <Box>
                <Typography sx={{ fontWeight: 800, mb: 1 }}>Geçmiş</Typography>
                <Stack spacing={1}>
                  {history.length === 0 ? (
                    <Typography color="text.secondary" variant="body2">Kayıtlı moderasyon geçmişi yok.</Typography>
                  ) : (
                    history.map((item) => (
                      <Box key={item.id} sx={{ border: '1px solid rgba(148,163,184,0.18)', borderRadius: 2, p: 1.5 }}>
                        <Typography sx={{ fontWeight: 700 }}>
                          {item.reviewer || 'Sistem'} · {new Date(item.createdAt).toLocaleString('tr-TR')}
                        </Typography>
                        <Typography color="text.secondary" sx={{ fontSize: 13, mt: 0.5 }}>
                          {statusOptions.find((option) => option.value === item.fromStatus)?.label} → {statusOptions.find((option) => option.value === item.toStatus)?.label}
                        </Typography>
                        {item.comment && (
                          <Typography sx={{ mt: 1 }}>{item.comment}</Typography>
                        )}
                      </Box>
                    ))
                  )}
                </Stack>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActiveItem(null)}>Kapat</Button>
          <Button onClick={() => void submitReview()} variant="contained">
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
