import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Badge,
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
import { ContactMessageStatus, type AdminContactMessage } from '../../models/contact'
import { contactApi } from '../../shared/api'

const CONTACT_MESSAGES_KEY = ['contact-messages', 'admin'] as const

const statusLabels: Record<ContactMessageStatus, string> = {
  [ContactMessageStatus.Pending]: 'Yeni',
  [ContactMessageStatus.Read]: 'Okundu',
  [ContactMessageStatus.InProgress]: 'İşlemde',
  [ContactMessageStatus.Resolved]: 'Çözüldü',
  [ContactMessageStatus.Closed]: 'Kapandı',
  [ContactMessageStatus.Spam]: 'Spam',
}

const statusColors: Record<ContactMessageStatus, 'default' | 'primary' | 'success' | 'warning' | 'error'> = {
  [ContactMessageStatus.Pending]: 'error',
  [ContactMessageStatus.Read]: 'primary',
  [ContactMessageStatus.InProgress]: 'warning',
  [ContactMessageStatus.Resolved]: 'success',
  [ContactMessageStatus.Closed]: 'default',
  [ContactMessageStatus.Spam]: 'default',
}

export function AdminContactMessagesPage() {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<ContactMessageStatus | ''>('')
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [email, setEmail] = useState('')
  const [search, setSearch] = useState('')
  const [createdFrom, setCreatedFrom] = useState('')
  const [createdTo, setCreatedTo] = useState('')
  const [selected, setSelected] = useState<AdminContactMessage | null>(null)
  const [adminNote, setAdminNote] = useState('')

  const query = useQuery({
    queryKey: [...CONTACT_MESSAGES_KEY, status, unreadOnly, email, search, createdFrom, createdTo],
    queryFn: () =>
      contactApi.getAdminMessages({
        createdFrom: createdFrom || undefined,
        createdTo: createdTo || undefined,
        email: email.trim() || undefined,
        page: 1,
        pageSize: 50,
        search: search.trim() || undefined,
        status: status === '' ? undefined : status,
        unreadOnly,
      }),
  })

  const detailMutation = useMutation({
    mutationFn: contactApi.getAdminMessage,
    onSuccess: (message) => {
      setSelected(message)
      setAdminNote(message.adminNote || '')
      void queryClient.invalidateQueries({ queryKey: CONTACT_MESSAGES_KEY })
    },
    onError: (error: Error) => toast.error(error.message || 'Mesaj açılamadı.'),
  })

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; status: ContactMessageStatus }) =>
      contactApi.updateStatus(payload.id, {
        adminNote: adminNote.trim() || undefined,
        status: payload.status,
      }),
    onSuccess: async (message) => {
      setSelected(message)
      setAdminNote(message.adminNote || '')
      await queryClient.invalidateQueries({ queryKey: CONTACT_MESSAGES_KEY })
      toast.success('Mesaj durumu güncellendi.')
    },
    onError: (error: Error) => toast.error(error.message || 'Güncelleme başarısız.'),
  })

  return (
    <Stack spacing={3}>
      <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1.5} sx={{ alignItems: { sm: 'center', xs: 'flex-start' } }}>
        <Badge badgeContent={query.data?.unreadCount || 0} color="error">
          <Typography sx={{ fontWeight: 900 }} variant="h4">
            İletişim mesajları
          </Typography>
        </Badge>
      </Stack>

      <Paper sx={{ borderRadius: 3, p: 2 }} variant="outlined">
        <Stack direction={{ md: 'row', xs: 'column' }} spacing={2}>
          <FormControl sx={{ minWidth: 160 }}>
            <InputLabel>Durum</InputLabel>
            <Select label="Durum" onChange={(e) => setStatus(e.target.value as ContactMessageStatus | '')} value={status}>
              <MenuItem value="">Tümü</MenuItem>
              {Object.values(ContactMessageStatus)
                .filter((value) => typeof value === 'number')
                .map((value) => (
                  <MenuItem key={value} value={value}>
                    {statusLabels[value as ContactMessageStatus]}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Okunma</InputLabel>
            <Select label="Okunma" onChange={(e) => setUnreadOnly(e.target.value === 'unread')} value={unreadOnly ? 'unread' : 'all'}>
              <MenuItem value="all">Tümü</MenuItem>
              <MenuItem value="unread">Sadece yeni</MenuItem>
            </Select>
          </FormControl>
          <TextField label="E-posta" onChange={(e) => setEmail(e.target.value)} value={email} />
          <TextField label="Arama" onChange={(e) => setSearch(e.target.value)} value={search} />
          <TextField
            label="Başlangıç"
            onChange={(e) => setCreatedFrom(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            type="date"
            value={createdFrom}
          />
          <TextField
            label="Bitiş"
            onChange={(e) => setCreatedTo(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            type="date"
            value={createdTo}
          />
        </Stack>
      </Paper>

      {selected && (
        <Paper sx={{ borderRadius: 3, p: 2.5 }} variant="outlined">
          <Stack spacing={2}>
            <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1} sx={{ justifyContent: 'space-between' }}>
              <Box>
                <Typography sx={{ fontWeight: 900 }} variant="h6">
                  {selected.subject}
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  {selected.name} - {selected.email}
                </Typography>
              </Box>
              <Chip color={statusColors[selected.status]} label={statusLabels[selected.status]} size="small" />
            </Stack>

            <Typography sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{selected.message}</Typography>

            <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { md: 'repeat(2, 1fr)', xs: '1fr' } }}>
              <Typography color="text.secondary" variant="body2">
                IP: {selected.ipAddress || '-'}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Tarih: {new Date(selected.createdAt).toLocaleString('tr-TR')}
              </Typography>
              <Typography color="text.secondary" sx={{ wordBreak: 'break-word' }} variant="body2">
                User-Agent: {selected.userAgent || '-'}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Atanan: {selected.assignedToEmail || selected.assignedToUserId || '-'}
              </Typography>
            </Box>

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
                disabled={updateMutation.isPending}
                onClick={() => updateMutation.mutate({ id: selected.id, status: ContactMessageStatus.InProgress })}
                variant="contained"
              >
                İşleme al
              </Button>
              <Button
                color="success"
                disabled={updateMutation.isPending}
                onClick={() => updateMutation.mutate({ id: selected.id, status: ContactMessageStatus.Resolved })}
                variant="outlined"
              >
                Çözüldü
              </Button>
              <Button
                disabled={updateMutation.isPending}
                onClick={() => updateMutation.mutate({ id: selected.id, status: ContactMessageStatus.Closed })}
                variant="outlined"
              >
                Kapat
              </Button>
              <Button
                color="error"
                disabled={updateMutation.isPending}
                onClick={() => updateMutation.mutate({ id: selected.id, status: ContactMessageStatus.Spam })}
                variant="outlined"
              >
                Spam
              </Button>
              <Button onClick={() => setSelected(null)}>Detayı kapat</Button>
            </Stack>
          </Stack>
        </Paper>
      )}

      {query.isLoading && <Skeleton height={320} variant="rounded" />}
      {query.isError && <Alert severity="error">Mesajlar yüklenemedi.</Alert>}

      {query.data && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Kullanıcı</TableCell>
                <TableCell>Konu</TableCell>
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
                    <Stack spacing={0.25}>
                      <Typography sx={{ fontWeight: item.readAt ? 500 : 900 }} variant="body2">
                        {item.name}
                      </Typography>
                      <Typography color="text.secondary" variant="caption">
                        {item.email}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{item.subject}</TableCell>
                  <TableCell>
                    <Chip color={statusColors[item.status]} label={statusLabels[item.status]} size="small" />
                  </TableCell>
                  <TableCell>{new Date(item.createdAt).toLocaleString('tr-TR')}</TableCell>
                  <TableCell>
                    <Box sx={{ maxWidth: 320 }}>
                      {item.message.length > 90 ? `${item.message.slice(0, 90)}...` : item.message}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Button disabled={detailMutation.isPending} onClick={() => detailMutation.mutate(item.id)} size="small">
                      Detay
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
