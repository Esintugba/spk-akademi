import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { useQuery } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { Link as RouterLink } from 'react-router'
import { EmptyState } from '../../components/common/EmptyState'
import { StudentPageHero } from '../../components/common/StudentPageHero'
import { supportTicketsApi } from '../../shared/api'
import {
  formatSupportDate,
  supportPriorityColor,
  supportStatusColor,
  supportTicketCategoryLabel,
  supportTicketPriorityLabel,
  supportTicketStatusLabel,
} from './supportTicketUi'

export function MySupportTicketsPage() {
  const ticketsQuery = useQuery({
    queryKey: ['support-tickets', 'my'],
    queryFn: supportTicketsApi.getMy,
  })

  return (
    <Stack spacing={3}>
      <StudentPageHero
        actions={
          <Button component={RouterLink} startIcon={<AddOutlinedIcon />} to="/support/new" variant="contained">
            Yeni Talep Oluştur
          </Button>
        }
        description="Oluşturduğun destek taleplerini, admin yanıtlarını ve durum güncellemelerini buradan takip edebilirsin."
        title="Destek Taleplerim"
      />

      {ticketsQuery.isLoading && <Skeleton height={260} variant="rounded" />}
      {ticketsQuery.isError && (
        <Alert severity="error">
          {ticketsQuery.error instanceof Error ? ticketsQuery.error.message : 'Destek talepleri yüklenemedi.'}
        </Alert>
      )}

      {!ticketsQuery.isLoading && !ticketsQuery.isError && (ticketsQuery.data?.length ?? 0) === 0 && (
        <EmptyState
          description="Bir sorun yaşadığında yeni destek talebi oluşturabilirsin."
          title="Henüz destek talebin yok"
        />
      )}

      {(ticketsQuery.data?.length ?? 0) > 0 && (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Talep No</TableCell>
                <TableCell>Konu</TableCell>
                <TableCell>Kategori</TableCell>
                <TableCell>Öncelik</TableCell>
                <TableCell>Durum</TableCell>
                <TableCell>Oluşturulma</TableCell>
                <TableCell>Son Güncellenme</TableCell>
                <TableCell align="right">Detay</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ticketsQuery.data?.map((ticket) => (
                <TableRow hover key={ticket.id}>
                  <TableCell>
                    <Typography sx={{ fontWeight: 850 }}>{ticket.ticketNumber}</Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 280 }}>
                    <Typography noWrap sx={{ fontWeight: 750 }}>{ticket.subject}</Typography>
                  </TableCell>
                  <TableCell>{supportTicketCategoryLabel(ticket.category)}</TableCell>
                  <TableCell>
                    <Chip color={supportPriorityColor(ticket.priority)} label={supportTicketPriorityLabel(ticket.priority)} size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip color={supportStatusColor(ticket.status)} label={supportTicketStatusLabel(ticket.status)} size="small" />
                  </TableCell>
                  <TableCell>{formatSupportDate(ticket.createdAt)}</TableCell>
                  <TableCell>{formatSupportDate(ticket.updatedAt ?? ticket.lastActivityAt)}</TableCell>
                  <TableCell align="right">
                    <Button
                      component={RouterLink}
                      size="small"
                      startIcon={<VisibilityOutlinedIcon />}
                      to={`/support/tickets/${ticket.id}`}
                      variant="outlined"
                    >
                      Aç
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Box>
        <Button component={RouterLink} to="/dashboard" variant="text">Dashboard'a dön</Button>
      </Box>
    </Stack>
  )
}
