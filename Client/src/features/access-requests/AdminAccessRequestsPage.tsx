import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { toast } from 'react-toastify'
import { AccessRequestStatus, type AdminAccessRequestItem } from '../../models/accessRequest'
import { accessRequestApi } from '../../shared/api'
import { accessRequestStatusColor, accessRequestStatusLabel } from './accessRequestUtils'

const ADMIN_QUEUE_KEY = ['access-requests', 'admin'] as const

function isFinalDecision(status: AccessRequestStatus) {
  return status === AccessRequestStatus.Approved || status === AccessRequestStatus.Rejected
}

export function AdminAccessRequestsPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<AccessRequestStatus | ''>('')
  const [reviewedFilter, setReviewedFilter] = useState<'all' | 'yes' | 'no'>('all')
  const [adminNote, setAdminNote] = useState('')
  const [correctionReason, setCorrectionReason] = useState('')
  const [isCorrectionMode, setIsCorrectionMode] = useState(false)
  const [approvalConfirmation, setApprovalConfirmation] = useState<'initial' | 'correction' | null>(null)
  const [selected, setSelected] = useState<AdminAccessRequestItem | null>(null)

  const query = useQuery({
    queryKey: [...ADMIN_QUEUE_KEY, statusFilter, reviewedFilter],
    queryFn: () =>
      accessRequestApi.getAdminQueue({
        status: statusFilter === '' ? undefined : statusFilter,
        reviewed: reviewedFilter === 'all' ? undefined : reviewedFilter === 'yes',
        page: 1,
        pageSize: 50,
      }),
  })

  function closeDetails() {
    setSelected(null)
    setAdminNote('')
    setCorrectionReason('')
    setIsCorrectionMode(false)
    setApprovalConfirmation(null)
  }

  function openDetails(item: AdminAccessRequestItem) {
    setSelected(item)
    setAdminNote(item.adminNote ?? '')
    setCorrectionReason('')
    setIsCorrectionMode(false)
  }

  function startCorrection() {
    setAdminNote('')
    setCorrectionReason('')
    setIsCorrectionMode(true)
  }

  function cancelCorrection() {
    setAdminNote(selected?.adminNote ?? '')
    setCorrectionReason('')
    setIsCorrectionMode(false)
  }

  async function finishUpdate(message: string) {
    await queryClient.invalidateQueries({ queryKey: ADMIN_QUEUE_KEY })
    toast.success(message)
    closeDetails()
  }

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; status: AccessRequestStatus }) =>
      accessRequestApi.updateStatus(payload.id, {
        status: payload.status,
        adminNote: adminNote.trim() || undefined,
      }),
    onSuccess: () => finishUpdate('Başvuru durumu güncellendi.'),
    onError: (error: Error) => {
      toast.error(error.message || 'Güncelleme başarısız.')
    },
  })

  const correctionMutation = useMutation({
    mutationFn: (payload: { id: string; status: AccessRequestStatus }) =>
      accessRequestApi.correctDecision(payload.id, {
        status: payload.status,
        adminNote: adminNote.trim() || undefined,
        correctionReason: correctionReason.trim(),
      }),
    onSuccess: () => finishUpdate('Başvuru kararı ve ilgili erişimler güvenli biçimde düzeltildi.'),
    onError: (error: Error) => {
      toast.error(error.message || 'Karar düzeltilemedi.')
    },
  })

  const isBusy = updateMutation.isPending || correctionMutation.isPending
  const selectedIsFinal = selected ? isFinalDecision(selected.status) : false
  const correctionTarget = selected?.status === AccessRequestStatus.Approved
    ? AccessRequestStatus.Rejected
    : AccessRequestStatus.Approved

  function submitInitialDecision(status: AccessRequestStatus) {
    if (!selected) return

    if (status === AccessRequestStatus.Rejected && !adminNote.trim()) {
      toast.error('Ret işlemi için admin notu zorunludur.')
      return
    }

    if (status === AccessRequestStatus.Approved) {
      setApprovalConfirmation('initial')
      return
    }

    updateMutation.mutate({ id: selected.id, status })
  }

  function submitCorrection() {
    if (!selected || !correctionReason.trim()) {
      toast.error('Karar düzeltme gerekçesi zorunludur.')
      return
    }

    if (correctionTarget === AccessRequestStatus.Rejected && !adminNote.trim()) {
      toast.error('Ret işlemi için admin notu zorunludur.')
      return
    }

    if (correctionTarget === AccessRequestStatus.Approved) {
      setApprovalConfirmation('correction')
      return
    }

    correctionMutation.mutate({ id: selected.id, status: correctionTarget })
  }

  function confirmApproval() {
    if (!selected || !approvalConfirmation) return

    if (approvalConfirmation === 'correction') {
      correctionMutation.mutate({ id: selected.id, status: AccessRequestStatus.Approved })
    } else {
      updateMutation.mutate({ id: selected.id, status: AccessRequestStatus.Approved })
    }
    setApprovalConfirmation(null)
  }

  return (
    <Stack spacing={3}>
      <Typography sx={{ fontWeight: 900 }} variant="h4">
        Erişim başvuru kuyruğu
      </Typography>

      <Stack direction={{ md: 'row', xs: 'column' }} spacing={2}>
        <FormControl sx={{ minWidth: 180 }}>
          <InputLabel>Durum</InputLabel>
          <Select
            label="Durum"
            onChange={(e) => setStatusFilter(e.target.value as AccessRequestStatus | '')}
            value={statusFilter}
          >
            <MenuItem value="">Tümü</MenuItem>
            <MenuItem value={AccessRequestStatus.Pending}>Beklemede</MenuItem>
            <MenuItem value={AccessRequestStatus.Waitlisted}>Bekleme listesi</MenuItem>
            <MenuItem value={AccessRequestStatus.Approved}>Onaylandı</MenuItem>
            <MenuItem value={AccessRequestStatus.Rejected}>Reddedildi</MenuItem>
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 180 }}>
          <InputLabel>İnceleme</InputLabel>
          <Select
            label="İnceleme"
            onChange={(e) => setReviewedFilter(e.target.value as 'all' | 'yes' | 'no')}
            value={reviewedFilter}
          >
            <MenuItem value="all">Tümü</MenuItem>
            <MenuItem value="no">İncelenmedi</MenuItem>
            <MenuItem value="yes">İncelendi</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {selected && (
        <Paper sx={{ borderRadius: 3, p: 2.5 }} variant="outlined">
          <Stack spacing={2}>
            <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1} sx={{ justifyContent: 'space-between' }}>
              <Box>
                <Typography sx={{ fontWeight: 800 }}>
                  {selected.studentEmail} — {selected.planName}
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  Başvuru mesajı: {selected.message || 'Mesaj yok'}
                </Typography>
              </Box>
              <Chip
                color={accessRequestStatusColor(selected.status)}
                label={accessRequestStatusLabel(selected.status)}
                size="small"
              />
            </Stack>

            {selectedIsFinal ? (
              <>
                <Divider />
                <Stack spacing={0.5}>
                  <Typography sx={{ fontWeight: 700 }}>Karar ayrıntıları</Typography>
                  <Typography variant="body2">
                    Admin notu: {selected.adminNote || 'Not eklenmemiş'}
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    İnceleyen: {selected.reviewedByEmail || 'Bilinmiyor'} ·{' '}
                    {selected.reviewedAt ? new Date(selected.reviewedAt).toLocaleString('tr-TR') : 'Tarih yok'}
                  </Typography>
                </Stack>

                {!isCorrectionMode ? (
                  <Stack direction="row" spacing={1}>
                    <Button onClick={startCorrection} variant="contained">
                      Kararı düzelt
                    </Button>
                    <Button onClick={closeDetails}>Kapat</Button>
                  </Stack>
                ) : (
                  <Stack spacing={2}>
                    <Alert severity="warning">
                      Karar {accessRequestStatusLabel(correctionTarget).toLocaleLowerCase('tr-TR')} olarak değiştirilecek.
                      Bu işlem denetim geçmişine kaydedilir.
                    </Alert>
                    <TextField
                      fullWidth
                      label="Karar düzeltme gerekçesi"
                      required
                      rows={2}
                      multiline
                      onChange={(e) => setCorrectionReason(e.target.value)}
                      value={correctionReason}
                    />
                    <TextField
                      fullWidth
                      label={correctionTarget === AccessRequestStatus.Rejected ? 'Admin notu (zorunlu)' : 'Admin notu'}
                      required={correctionTarget === AccessRequestStatus.Rejected}
                      rows={2}
                      multiline
                      onChange={(e) => setAdminNote(e.target.value)}
                      value={adminNote}
                    />
                    <Stack direction="row" spacing={1}>
                      <Button
                        color={correctionTarget === AccessRequestStatus.Rejected ? 'error' : 'success'}
                        disabled={isBusy}
                        onClick={submitCorrection}
                        variant="contained"
                      >
                        {correctionTarget === AccessRequestStatus.Rejected ? 'Reddet olarak düzelt' : 'Onayla olarak düzelt'}
                      </Button>
                      <Button disabled={isBusy} onClick={cancelCorrection}>
                        Vazgeç
                      </Button>
                    </Stack>
                  </Stack>
                )}

                <Divider />
                <Stack spacing={1}>
                  <Typography sx={{ fontWeight: 700 }}>Denetim geçmişi</Typography>
                  {selected.history.length === 0 ? (
                    <Typography color="text.secondary" variant="body2">
                      Bu eski başvuru için kayıtlı karar geçmişi bulunmuyor.
                    </Typography>
                  ) : selected.history.map((entry) => (
                    <Box key={entry.id} sx={{ bgcolor: 'action.hover', borderRadius: 2, p: 1.5 }}>
                      <Typography sx={{ fontWeight: 700 }} variant="body2">
                        {accessRequestStatusLabel(entry.fromStatus)} → {accessRequestStatusLabel(entry.toStatus)}
                        {entry.isCorrection ? ' · Düzeltme' : ''}
                      </Typography>
                      <Typography color="text.secondary" variant="caption">
                        {new Date(entry.changedAt).toLocaleString('tr-TR')} · {entry.changedByEmail || 'Bilinmeyen admin'}
                      </Typography>
                      {entry.correctionReason && (
                        <Typography variant="body2">Gerekçe: {entry.correctionReason}</Typography>
                      )}
                      {entry.adminNote && <Typography variant="body2">Admin notu: {entry.adminNote}</Typography>}
                    </Box>
                  ))}
                </Stack>
              </>
            ) : (
              <>
                <TextField
                  fullWidth
                  label="Admin notu"
                  rows={2}
                  multiline
                  onChange={(e) => setAdminNote(e.target.value)}
                  value={adminNote}
                />
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  <Button
                    color="success"
                    disabled={isBusy}
                    onClick={() => submitInitialDecision(AccessRequestStatus.Approved)}
                    variant="contained"
                  >
                    Onayla
                  </Button>
                  <Button
                    color="error"
                    disabled={isBusy}
                    onClick={() => submitInitialDecision(AccessRequestStatus.Rejected)}
                    variant="outlined"
                  >
                    Reddet
                  </Button>
                  <Button
                    disabled={isBusy}
                    onClick={() => submitInitialDecision(AccessRequestStatus.Waitlisted)}
                    variant="outlined"
                  >
                    Bekleme listesi
                  </Button>
                  <Button onClick={closeDetails}>Kapat</Button>
                </Stack>
              </>
            )}
          </Stack>
        </Paper>
      )}

      {query.isLoading && <Skeleton height={320} variant="rounded" />}
      {query.isError && <Alert severity="error">Kuyruk yüklenemedi.</Alert>}

      {query.data && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Kullanıcı</TableCell>
                <TableCell>Plan</TableCell>
                <TableCell>Durum</TableCell>
                <TableCell>Tarih</TableCell>
                <TableCell>Mesaj</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {query.data.items.map((item) => (
                <TableRow key={item.id} selected={selected?.id === item.id}>
                  <TableCell>
                    <Typography variant="body2">{item.studentEmail}</Typography>
                    <Typography color="text.secondary" variant="caption">
                      {item.studentDisplayName || item.studentId}
                    </Typography>
                  </TableCell>
                  <TableCell>{item.planName}</TableCell>
                  <TableCell>
                    <Chip
                      color={accessRequestStatusColor(item.status)}
                      label={accessRequestStatusLabel(item.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{new Date(item.requestedAt).toLocaleString('tr-TR')}</TableCell>
                  <TableCell>
                    <Box sx={{ maxWidth: 280 }}>
                      {item.message ? (item.message.length > 80 ? `${item.message.slice(0, 80)}…` : item.message) : '—'}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Button onClick={() => openDetails(item)} size="small">
                      {isFinalDecision(item.status) ? 'Detay / Düzeltme' : 'İşlem'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={approvalConfirmation !== null} onClose={() => !isBusy && setApprovalConfirmation(null)}>
        <DialogTitle>Erişim onayını doğrulayın</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {selected?.studentEmail} kullanıcısına “{selected?.planName}” planındaki lisans erişimleri verilecek.
            Bu işlem kullanıcıya onay e-postası gönderebilir.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button disabled={isBusy} onClick={() => setApprovalConfirmation(null)}>Vazgeç</Button>
          <Button color="success" disabled={isBusy} onClick={confirmApproval} variant="contained">
            Evet, erişimi onayla
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
