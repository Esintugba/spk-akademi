import AttachFileOutlinedIcon from '@mui/icons-material/AttachFileOutlined'
import SendOutlinedIcon from '@mui/icons-material/SendOutlined'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { Link as RouterLink, useParams } from 'react-router'
import { StudentPageHero } from '../../components/common/StudentPageHero'
import { SupportTicketStatus } from '../../models'
import { resolveApiAssetUrl, supportTicketsApi } from '../../shared/api'
import {
  formatSupportDate,
  supportPriorityColor,
  supportStatusColor,
  supportTicketCategoryLabel,
  supportTicketPriorityLabel,
  supportTicketStatusLabel,
} from './supportTicketUi'

export function SupportTicketDetailPage() {
  const { id = '' } = useParams()
  const queryClient = useQueryClient()
  const [message, setMessage] = useState('')
  const [attachment, setAttachment] = useState<File | null>(null)

  const ticketQuery = useQuery({
    enabled: Boolean(id),
    queryKey: ['support-tickets', 'mine', id],
    queryFn: () => supportTicketsApi.getMineById(id),
  })

  const messageMutation = useMutation({
    mutationFn: () => {
      const formData = new FormData()
      formData.append('message', message)
      if (attachment) {
        formData.append('attachment', attachment)
      }

      return supportTicketsApi.addUserMessage(id, formData)
    },
    onSuccess: async () => {
      setMessage('')
      setAttachment(null)
      await queryClient.invalidateQueries({ queryKey: ['support-tickets'] })
    },
  })

  if (ticketQuery.isLoading) {
    return (
      <Stack spacing={3}>
        <Skeleton height={220} variant="rounded" />
        <Skeleton height={360} variant="rounded" />
      </Stack>
    )
  }

  if (ticketQuery.isError || !ticketQuery.data) {
    return <Alert severity="error">{ticketQuery.error instanceof Error ? ticketQuery.error.message : 'Talep detayı yüklenemedi.'}</Alert>
  }

  const ticket = ticketQuery.data
  const isClosed = ticket.status === SupportTicketStatus.Closed

  return (
    <Stack spacing={3}>
      <StudentPageHero
        actions={<Button component={RouterLink} to="/support/my-tickets" variant="outlined">Taleplerime Dön</Button>}
        description={`${ticket.ticketNumber} numaralı talebin mesaj geçmişi ve durum hareketleri.`}
        title={ticket.subject}
        sideContent={
          <Paper sx={{ borderRadius: 3, p: 2.5 }} variant="outlined">
            <Stack spacing={1.2}>
              <Chip color={supportStatusColor(ticket.status)} label={supportTicketStatusLabel(ticket.status)} sx={{ alignSelf: 'flex-start' }} />
              <Typography color="text.secondary" variant="body2">Kategori: {supportTicketCategoryLabel(ticket.category)}</Typography>
              <Typography color="text.secondary" variant="body2">Öncelik: {supportTicketPriorityLabel(ticket.priority)}</Typography>
              <Typography color="text.secondary" variant="body2">Son güncelleme: {formatSupportDate(ticket.updatedAt ?? ticket.createdAt)}</Typography>
            </Stack>
          </Paper>
        }
      />

      <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { lg: '1fr 360px', xs: '1fr' } }}>
        <Stack spacing={2.5}>
          <Paper sx={{ borderRadius: 3, p: 2.5 }} variant="outlined">
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mb: 2 }}>
              <Chip label={supportTicketCategoryLabel(ticket.category)} />
              <Chip color={supportPriorityColor(ticket.priority)} label={supportTicketPriorityLabel(ticket.priority)} />
              <Chip color={supportStatusColor(ticket.status)} label={supportTicketStatusLabel(ticket.status)} />
            </Stack>
            <Typography color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>{ticket.description}</Typography>
          </Paper>

          <Paper sx={{ borderRadius: 3, p: 2.5 }} variant="outlined">
            <Typography sx={{ fontSize: 22, fontWeight: 900, mb: 2 }}>Mesajlaşma</Typography>
            <Stack spacing={2}>
              {ticket.messages.map((item) => (
                <Paper
                  key={item.id}
                  sx={{
                    bgcolor: item.isAdminReply ? 'rgba(37,99,235,0.06)' : 'rgba(15,118,110,0.06)',
                    borderRadius: 2,
                    p: 2,
                  }}
                  variant="outlined"
                >
                  <Stack direction={{ sm: 'row', xs: 'column' }} sx={{ justifyContent: 'space-between', gap: 0.5 }}>
                    <Typography sx={{ fontWeight: 850 }}>{item.isAdminReply ? 'Admin' : 'Sen'}</Typography>
                    <Typography color="text.secondary" variant="body2">{formatSupportDate(item.createdAt)}</Typography>
                  </Stack>
                  <Typography sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>{item.message}</Typography>
                  {item.attachmentUrl && (
                    <Button
                      component="a"
                      href={resolveApiAssetUrl(item.attachmentUrl)}
                      size="small"
                      startIcon={<AttachFileOutlinedIcon />}
                      sx={{ mt: 1.5 }}
                      target="_blank"
                    >
                      Eki Aç
                    </Button>
                  )}
                </Paper>
              ))}
            </Stack>

            <Divider sx={{ my: 2.5 }} />
            {messageMutation.isError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {messageMutation.error instanceof Error ? messageMutation.error.message : 'Mesaj gönderilemedi.'}
              </Alert>
            )}
            {isClosed ? (
              <Alert severity="info">Bu talep kapatıldığı için yeni mesaj eklenemez.</Alert>
            ) : (
              <Stack spacing={1.5}>
                <TextField
                  fullWidth
                  label="Yanıt yaz"
                  rows={4}
                  multiline
                  onChange={(event) => setMessage(event.target.value)}
                  value={message}
                />
                <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1.5} sx={{ alignItems: { sm: 'center', xs: 'stretch' } }}>
                  <Button component="label" startIcon={<AttachFileOutlinedIcon />} variant="outlined">
                    Dosya Eki
                    <input
                      hidden
                      onChange={(event) => setAttachment(event.target.files?.[0] ?? null)}
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.txt"
                    />
                  </Button>
                  <Typography color="text.secondary" variant="body2">{attachment ? attachment.name : 'Opsiyonel dosya eki'}</Typography>
                  <Button
                    disabled={message.trim().length < 2 || messageMutation.isPending}
                    onClick={() => messageMutation.mutate()}
                    startIcon={<SendOutlinedIcon />}
                    variant="contained"
                  >
                    Gönder
                  </Button>
                </Stack>
              </Stack>
            )}
          </Paper>
        </Stack>

        <Paper sx={{ alignSelf: 'start', borderRadius: 3, p: 2.5 }} variant="outlined">
          <Typography sx={{ fontSize: 20, fontWeight: 900, mb: 2 }}>Durum Geçmişi</Typography>
          <Stack spacing={1.5}>
            {ticket.statusHistory.map((item) => (
              <Box key={item.id}>
                <Typography sx={{ fontWeight: 800 }}>{supportTicketStatusLabel(item.newStatus)}</Typography>
                <Typography color="text.secondary" variant="body2">
                  {formatSupportDate(item.createdAt)}
                  {item.changedByEmail ? ` · ${item.changedByEmail}` : ''}
                </Typography>
                {item.note && <Typography color="text.secondary" variant="body2">{item.note}</Typography>}
              </Box>
            ))}
          </Stack>
        </Paper>
      </Box>
    </Stack>
  )
}
