import AttachFileOutlinedIcon from '@mui/icons-material/AttachFileOutlined'
import SendOutlinedIcon from '@mui/icons-material/SendOutlined'
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  MenuItem,
  Paper,
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
import { useEffect, useState } from 'react'
import {
  SupportTicketPriority,
  SupportTicketStatus,
  supportTicketCategories,
  supportTicketPriorities,
  supportTicketStatuses,
  type SupportTicketQuery,
} from '../../models'
import { resolveApiAssetUrl, supportTicketsApi, userLicenseAccessesApi } from '../../shared/api'
import { AdminMetricCard } from '../../components/common/AdminMetricCard'
import { AdminPageHero } from '../../components/common/AdminPageHero'
import {
  formatSupportDate,
  supportPriorityColor,
  supportStatusColor,
  supportTicketCategoryLabel,
  supportTicketPriorityLabel,
  supportTicketStatusLabel,
} from './supportTicketUi'

export function AdminSupportTicketsPage() {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<SupportTicketQuery>({ page: 1, pageSize: 20 })
  const [selectedId, setSelectedId] = useState('')
  const [reply, setReply] = useState('')
  const [attachment, setAttachment] = useState<File | null>(null)
  const [status, setStatus] = useState<SupportTicketStatus | ''>('')
  const [priority, setPriority] = useState<SupportTicketPriority | ''>('')
  const [assignedAdminId, setAssignedAdminId] = useState('')
  const [note, setNote] = useState('')

  const ticketsQuery = useQuery({
    queryKey: ['admin', 'support-tickets', filters],
    queryFn: () => supportTicketsApi.getAdmin(filters),
  })
  const summaryQuery = useQuery({
    queryKey: ['admin', 'support-tickets', 'summary'],
    queryFn: supportTicketsApi.getAdminSummary,
    refetchInterval: 30_000,
  })
  const usersQuery = useQuery({
    queryKey: ['admin', 'users', 'support-ticket-assignment'],
    queryFn: userLicenseAccessesApi.getUsers,
    staleTime: 300_000,
  })
  const detailQuery = useQuery({
    enabled: Boolean(selectedId),
    queryKey: ['admin', 'support-tickets', selectedId],
    queryFn: () => supportTicketsApi.getAdminById(selectedId),
  })

  const adminUsers = (usersQuery.data ?? []).filter((user) => user.roles.includes('Admin'))

  useEffect(() => {
    if (!detailQuery.data) {
      return
    }

    setStatus(detailQuery.data.status)
    setPriority(detailQuery.data.priority)
    setAssignedAdminId(detailQuery.data.assignedAdminId ?? '')
    setNote('')
  }, [detailQuery.data])

  const updateMutation = useMutation({
    mutationFn: () => supportTicketsApi.updateAdmin(selectedId, {
      assignedAdminId,
      note,
      priority: priority || undefined,
      status: status || undefined,
    }),
    onSuccess: async () => {
      await invalidateSupportQueries(queryClient)
    },
  })

  const replyMutation = useMutation({
    mutationFn: () => {
      const formData = new FormData()
      formData.append('message', reply)
      if (attachment) {
        formData.append('attachment', attachment)
      }

      return supportTicketsApi.addAdminMessage(selectedId, formData)
    },
    onSuccess: async () => {
      setReply('')
      setAttachment(null)
      await invalidateSupportQueries(queryClient)
    },
  })

  const summary = summaryQuery.data
  const selectedTicket = detailQuery.data

  return (
    <Stack spacing={3}>
      <AdminPageHero
        description="Öğrenci destek taleplerini filtrele, yanıtla, ata, önceliklendir ve kapat."
        eyebrow="Destek Operasyonları"
        title="Support Tickets"
      />

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { md: 'repeat(4, 1fr)', xs: '1fr' } }}>
        <AdminMetricCard detail="Açık/İşlemde/Kullanıcı Bekleyen" icon={<SupportAgentOutlinedIcon />} label="Bekleyen Talepler" value={summary?.pendingTickets ?? 0} />
        <AdminMetricCard detail="Henüz admin atanmamış" icon={<SupportAgentOutlinedIcon />} label="Atanmamış" value={summary?.unassignedTickets ?? 0} />
        <AdminMetricCard detail="Bugün oluşturulmuş" icon={<SupportAgentOutlinedIcon />} label="Bugün Açılan" value={summary?.openedToday ?? 0} />
        <AdminMetricCard detail="Kritik ve kapanmamış" icon={<SupportAgentOutlinedIcon />} label="Kritik" value={summary?.criticalTickets ?? 0} />
      </Box>

      <Paper sx={{ borderRadius: 3, p: 2 }} variant="outlined">
        <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { lg: 'repeat(6, 1fr)', sm: 'repeat(2, 1fr)', xs: '1fr' } }}>
          <TextField
            label="Arama"
            onChange={(event) => setFilters((current) => ({ ...current, page: 1, search: event.target.value }))}
            value={filters.search ?? ''}
          />
          <TextField
            label="Durum"
            onChange={(event) => setFilters((current) => ({ ...current, page: 1, status: event.target.value === '' ? '' : Number(event.target.value) as SupportTicketStatus }))}
            select
            value={filters.status ?? ''}
          >
            <MenuItem value="">Tümü</MenuItem>
            {supportTicketStatuses.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
          </TextField>
          <TextField
            label="Kategori"
            onChange={(event) => setFilters((current) => ({ ...current, page: 1, category: event.target.value === '' ? '' : Number(event.target.value) }))}
            select
            value={filters.category ?? ''}
          >
            <MenuItem value="">Tümü</MenuItem>
            {supportTicketCategories.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
          </TextField>
          <TextField
            label="Öncelik"
            onChange={(event) => setFilters((current) => ({ ...current, page: 1, priority: event.target.value === '' ? '' : Number(event.target.value) as SupportTicketPriority }))}
            select
            value={filters.priority ?? ''}
          >
            <MenuItem value="">Tümü</MenuItem>
            {supportTicketPriorities.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
          </TextField>
          <TextField
            label="Atama"
            onChange={(event) => setFilters((current) => ({ ...current, page: 1, unassignedOnly: event.target.value === 'unassigned' ? true : undefined }))}
            select
            value={filters.unassignedOnly ? 'unassigned' : ''}
          >
            <MenuItem value="">Tümü</MenuItem>
            <MenuItem value="unassigned">Atanmamış</MenuItem>
          </TextField>
          <Button onClick={() => setFilters({ page: 1, pageSize: 20 })} variant="outlined">Temizle</Button>
        </Box>
      </Paper>

      <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xl: '1fr 520px', xs: '1fr' } }}>
        <Paper sx={{ borderRadius: 3, overflow: 'hidden' }} variant="outlined">
          {ticketsQuery.isLoading && <Skeleton height={360} variant="rounded" />}
          {ticketsQuery.isError && <Alert severity="error">{ticketsQuery.error instanceof Error ? ticketsQuery.error.message : 'Talepler yüklenemedi.'}</Alert>}
          {ticketsQuery.data && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Talep</TableCell>
                    <TableCell>Kategori</TableCell>
                    <TableCell>Öncelik</TableCell>
                    <TableCell>Durum</TableCell>
                    <TableCell>Öğrenci</TableCell>
                    <TableCell>Son Aktivite</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ticketsQuery.data.items.map((ticket) => (
                    <TableRow
                      hover
                      key={ticket.id}
                      onClick={() => setSelectedId(ticket.id)}
                      selected={ticket.id === selectedId}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Typography sx={{ fontWeight: 850 }}>{ticket.ticketNumber}</Typography>
                        <Typography color="text.secondary" noWrap sx={{ maxWidth: 260 }} variant="body2">{ticket.subject}</Typography>
                      </TableCell>
                      <TableCell>{supportTicketCategoryLabel(ticket.category)}</TableCell>
                      <TableCell><Chip color={supportPriorityColor(ticket.priority)} label={supportTicketPriorityLabel(ticket.priority)} size="small" /></TableCell>
                      <TableCell><Chip color={supportStatusColor(ticket.status)} label={supportTicketStatusLabel(ticket.status)} size="small" /></TableCell>
                      <TableCell>{ticket.assignedAdminEmail ?? 'Atanmamış'}</TableCell>
                      <TableCell>{formatSupportDate(ticket.lastActivityAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        <Paper sx={{ alignSelf: 'start', borderRadius: 3, p: 2.5 }} variant="outlined">
          {!selectedId && <Typography color="text.secondary">Detay görüntülemek için listeden bir talep seç.</Typography>}
          {selectedId && detailQuery.isLoading && <Skeleton height={420} variant="rounded" />}
          {detailQuery.isError && <Alert severity="error">{detailQuery.error instanceof Error ? detailQuery.error.message : 'Talep detayı yüklenemedi.'}</Alert>}
          {selectedTicket && (
            <Stack spacing={2.5}>
              <Box>
                <Typography sx={{ fontSize: 22, fontWeight: 900 }}>{selectedTicket.ticketNumber}</Typography>
                <Typography color="text.secondary">{selectedTicket.subject}</Typography>
                <Typography color="text.secondary" variant="body2">{selectedTicket.userEmail}</Typography>
              </Box>

              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                <Chip color={supportStatusColor(selectedTicket.status)} label={supportTicketStatusLabel(selectedTicket.status)} />
                <Chip color={supportPriorityColor(selectedTicket.priority)} label={supportTicketPriorityLabel(selectedTicket.priority)} />
                <Chip label={supportTicketCategoryLabel(selectedTicket.category)} />
              </Stack>

              <TextField
                label="Durum"
                onChange={(event) => setStatus(Number(event.target.value) as SupportTicketStatus)}
                select
                value={status}
              >
                {supportTicketStatuses.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
              </TextField>
              <TextField
                label="Öncelik"
                onChange={(event) => setPriority(Number(event.target.value) as SupportTicketPriority)}
                select
                value={priority}
              >
                {supportTicketPriorities.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
              </TextField>
              <TextField
                label="Atanan Admin"
                onChange={(event) => setAssignedAdminId(event.target.value)}
                select
                value={assignedAdminId}
              >
                <MenuItem value="">Atanmamış</MenuItem>
                {adminUsers.map((user) => <MenuItem key={user.id} value={user.id}>{user.displayName || user.email}</MenuItem>)}
              </TextField>
              <TextField
                label="Durum notu"
                multiline
                rows={2}
                onChange={(event) => setNote(event.target.value)}
                value={note}
              />
              <Button disabled={updateMutation.isPending} onClick={() => updateMutation.mutate()} variant="contained">
                Talebi Güncelle
              </Button>

              <Divider />
              <Typography sx={{ fontSize: 20, fontWeight: 900 }}>Mesajlar</Typography>
              <Stack spacing={1.5} sx={{ maxHeight: 360, overflow: 'auto', pr: 0.5 }}>
                {selectedTicket.messages.map((item) => (
                  <Paper key={item.id} sx={{ borderRadius: 2, p: 1.5 }} variant="outlined">
                    <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 1 }}>
                      <Typography sx={{ fontWeight: 850 }}>{item.isAdminReply ? 'Admin' : selectedTicket.userEmail}</Typography>
                      <Typography color="text.secondary" variant="body2">{formatSupportDate(item.createdAt)}</Typography>
                    </Stack>
                    <Typography sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>{item.message}</Typography>
                    {item.attachmentUrl && (
                      <Button component="a" href={resolveApiAssetUrl(item.attachmentUrl)} size="small" target="_blank">
                        Eki Aç
                      </Button>
                    )}
                  </Paper>
                ))}
              </Stack>

              <TextField
                label="Admin yanıtı"
                rows={4}
                multiline
                onChange={(event) => setReply(event.target.value)}
                value={reply}
              />
              <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1}>
                <Button component="label" startIcon={<AttachFileOutlinedIcon />} variant="outlined">
                  Dosya
                  <input
                    hidden
                    onChange={(event) => setAttachment(event.target.files?.[0] ?? null)}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.txt"
                  />
                </Button>
                <Button
                  disabled={reply.trim().length < 2 || replyMutation.isPending || selectedTicket.status === SupportTicketStatus.Closed}
                  onClick={() => replyMutation.mutate()}
                  startIcon={<SendOutlinedIcon />}
                  variant="contained"
                >
                  Yanıtla
                </Button>
              </Stack>
              {attachment && <Typography color="text.secondary" variant="body2">{attachment.name}</Typography>}
            </Stack>
          )}
        </Paper>
      </Box>
    </Stack>
  )
}

async function invalidateSupportQueries(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['admin', 'support-tickets'] }),
    queryClient.invalidateQueries({ queryKey: ['support-tickets'] }),
    queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] }),
  ])
}
