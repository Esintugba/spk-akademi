import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  Chip,
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

export function AdminAccessRequestsPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<AccessRequestStatus | ''>('')
  const [reviewedFilter, setReviewedFilter] = useState<'all' | 'yes' | 'no'>('all')
  const [adminNote, setAdminNote] = useState('')
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

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; status: AccessRequestStatus }) =>
      accessRequestApi.updateStatus(payload.id, {
        status: payload.status,
        adminNote: adminNote.trim() || undefined,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ADMIN_QUEUE_KEY })
      toast.success('Başvuru durumu güncellendi.')
      setSelected(null)
      setAdminNote('')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Güncelleme başarısız.')
    },
  })

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
        <Paper sx={{ borderRadius: 3, p: 2 }} variant="outlined">
          <Typography sx={{ fontWeight: 700, mb: 1 }}>
            {selected.studentEmail} — {selected.planName}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }} variant="body2">
            {selected.message || 'Mesaj yok'}
          </Typography>
          <TextField
            fullWidth
            label="Admin notu"
            rows={2}
            multiline
            onChange={(e) => setAdminNote(e.target.value)}
            sx={{ mb: 2 }}
            value={adminNote}
          />
          <Stack direction="row" spacing={1}>
            <Button
              color="success"
              disabled={updateMutation.isPending}
              onClick={() => updateMutation.mutate({ id: selected.id, status: AccessRequestStatus.Approved })}
              variant="contained"
            >
              Onayla
            </Button>
            <Button
              color="error"
              disabled={updateMutation.isPending}
              onClick={() => updateMutation.mutate({ id: selected.id, status: AccessRequestStatus.Rejected })}
              variant="outlined"
            >
              Reddet
            </Button>
            <Button
              disabled={updateMutation.isPending}
              onClick={() => updateMutation.mutate({ id: selected.id, status: AccessRequestStatus.Waitlisted })}
              variant="outlined"
            >
              Bekleme listesi
            </Button>
            <Button onClick={() => setSelected(null)}>Kapat</Button>
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
                    <Button onClick={() => setSelected(item)} size="small">
                      İşlem
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Stack>
  )
}
