import { useQuery } from '@tanstack/react-query'
import { Alert, Chip, Paper, Skeleton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router'
import { accessRequestApi } from '../../shared/api'
import { StudentPageHero } from '../../components/common/StudentPageHero'
import { EmptyState } from '../../components/common/EmptyState'
import { accessRequestStatusColor, accessRequestStatusLabel } from './accessRequestUtils'

const MY_REQUESTS_KEY = ['access-requests', 'my'] as const

export function MyAccessRequestsPage() {
  const query = useQuery({
    queryKey: MY_REQUESTS_KEY,
    queryFn: () => accessRequestApi.getMy(),
  })

  return (
    <Stack spacing={3}>
      <StudentPageHero
        description="Beta/lisans erişim başvurularınızın durumunu buradan takip edebilirsiniz."
        title="Erişim Başvurularım"
      />

      {query.isLoading && <Skeleton height={240} variant="rounded" />}
      {query.isError && (
        <Alert severity="error">
          {query.error instanceof Error ? query.error.message : 'Başvurular yüklenemedi.'}
        </Alert>
      )}

      {!query.isLoading && !query.isError && (query.data?.length ?? 0) === 0 && (
        <EmptyState
          description="Plans sayfasından erişim talebi gönderebilirsiniz."
          title="Henüz başvurunuz yok"
        />
      )}

      {(query.data?.length ?? 0) > 0 && (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Plan</TableCell>
                <TableCell>Durum</TableCell>
                <TableCell>Başvuru tarihi</TableCell>
                <TableCell>Admin notu</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {query.data?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.planName}</TableCell>
                  <TableCell>
                    <Chip
                      color={accessRequestStatusColor(item.status)}
                      label={accessRequestStatusLabel(item.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{new Date(item.requestedAt).toLocaleString('tr-TR')}</TableCell>
                  <TableCell>{item.adminNote || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Typography variant="body2">
        <RouterLink to="/plans">Planlar</RouterLink> sayfasına dön
      </Typography>
    </Stack>
  )
}
