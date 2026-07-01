import { useQuery } from '@tanstack/react-query'
import { Alert, Box, Chip, Paper, Skeleton, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { api } from '../../shared/api'
import { AdminMetricCard } from '../common/AdminMetricCard'
import { AdminPageHero } from '../common/AdminPageHero'

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString('tr-TR') : '-'
}

export function AdminConsentsPage() {
  const query = useQuery({
    queryKey: ['admin', 'consents'],
    queryFn: api.getConsentSummary,
    refetchInterval: 60_000,
  })

  if (query.isLoading) {
    return <Skeleton height={520} variant="rounded" />
  }

  if (query.error instanceof Error || !query.data) {
    return <Alert severity="error">{query.error?.message || 'Onay kayıtları yüklenemedi.'}</Alert>
  }

  const data = query.data

  return (
    <Stack spacing={3}>
      <AdminPageHero
        eyebrow="Çerez ve KVKK"
        title="Kullanıcı onay kayıtlarını izle."
        description="Çerez tercihleri, KVKK açık rıza kayıtları, IP, tarih ve versiyon bilgileri bu ekrandan takip edilir."
      />

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { md: 'repeat(4, 1fr)', xs: '1fr' } }}>
        <AdminMetricCard detail={`Son onay: ${formatDate(data.lastCookieConsentAt)}`} icon={<span />} label="Çerez kabul" value={data.cookieAcceptedCount} />
        <AdminMetricCard detail="Analitik ve pazarlama kapalı" icon={<span />} label="Çerez red" value={data.cookieRejectedCount} />
        <AdminMetricCard detail={`Son KVKK: ${formatDate(data.lastKvkkConsentAt)}`} icon={<span />} label="KVKK onayı" value={data.kvkkConsentCount} />
        <AdminMetricCard detail="Son 30 kayıt listelenir" icon={<span />} label="Kayıt" value={data.recentConsents.length} />
      </Box>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Tür</TableCell>
              <TableCell>Kullanıcı ID</TableCell>
              <TableCell>IP</TableCell>
              <TableCell>Tarih</TableCell>
              <TableCell>Versiyon</TableCell>
              <TableCell>Onaylar</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.recentConsents.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.consentType}</TableCell>
                <TableCell>{item.userId || '-'}</TableCell>
                <TableCell>{item.ipAddress || '-'}</TableCell>
                <TableCell>{formatDate(item.createdAt)}</TableCell>
                <TableCell>{item.version}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', gap: 0.75 }}>
                    {item.analytics && <Chip label="Analitik" size="small" />}
                    {item.marketing && <Chip label="Pazarlama" size="small" />}
                    {item.kvkkAccepted && <Chip color="success" label="KVKK" size="small" />}
                    {item.commercialElectronicMessages && <Chip label="Ticari ileti" size="small" />}
                    {!item.analytics && !item.marketing && !item.kvkkAccepted && !item.commercialElectronicMessages && (
                      <Typography color="text.secondary" variant="body2">Sadece zorunlu</Typography>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Stack>
  )
}
