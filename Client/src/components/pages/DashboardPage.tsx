import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined'
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined'
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined'
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined'
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined'
import HealthAndSafetyOutlinedIcon from '@mui/icons-material/HealthAndSafetyOutlined'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import MailOutlineOutlinedIcon from '@mui/icons-material/MailOutlineOutlined'
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined'
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import { useQuery } from '@tanstack/react-query'
import { Alert, Box, Button, Chip, LinearProgress, Paper, Skeleton, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { Link as RouterLink } from 'react-router'
import type { AdminDashboard } from '../../models'
import { api } from '../../shared/api'
import { AdminMetricCard } from '../common/AdminMetricCard'
import { AdminPageHero } from '../common/AdminPageHero'
import { AdminSurface } from '../common/AdminSurface'
import { EmptyState } from '../common/EmptyState'

function formatNumber(value: number) {
  return new Intl.NumberFormat('tr-TR').format(value)
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('tr-TR', { day: '2-digit', hour: '2-digit', minute: '2-digit', month: 'short' })
}

export function DashboardPage() {
  const dashboardQuery = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: api.getAdminDashboard,
    refetchInterval: 30_000,
    staleTime: 20_000,
  })

  if (dashboardQuery.isLoading) {
    return (
      <Stack spacing={3}>
        <Skeleton height={260} variant="rounded" />
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { md: 'repeat(4, 1fr)', xs: '1fr' } }}>
          {[1, 2, 3, 4].map((item) => <Skeleton height={150} key={item} variant="rounded" />)}
        </Box>
        <Skeleton height={360} variant="rounded" />
      </Stack>
    )
  }

  if (dashboardQuery.error instanceof Error || !dashboardQuery.data) {
    return <Alert severity="error">{dashboardQuery.error?.message || 'Admin dashboard yüklenemedi.'}</Alert>
  }

  const dashboard = dashboardQuery.data
  const pendingTotal = Object.values(dashboard.pendingActions).reduce((total, value) => total + value, 0)

  return (
    <Stack spacing={3.5}>
      <AdminPageHero
        eyebrow="Operasyon Merkezi"
        title="Bugün aksiyon bekleyen işleri tek ekranda yönet."
        description="Erişim talepleri, moderasyon kuyruğu, kullanıcı hareketleri, mesajlar ve kritik içerik uyarıları admin panelinin ilk ekranında toplanır."
        actions={
          <>
            <Button component={RouterLink} to="/admin/access-requests" variant="contained">Erişim Talepleri</Button>
            <Button component={RouterLink} to="/admin/moderation" variant="outlined">Moderasyon Kuyruğu</Button>
          </>
        }
        sideContent={
          <Paper sx={{ borderRadius: 4, p: 3 }} variant="outlined">
            <Stack spacing={2}>
              <Typography color="text.secondary" sx={{ fontSize: 13, fontWeight: 800 }}>İşlem Bekleyen Öğeler</Typography>
              <Typography sx={{ fontSize: 42, fontWeight: 900 }}>{formatNumber(pendingTotal)}</Typography>
              <Typography color="text.secondary" variant="body2">
                {pendingTotal > 0 ? 'Önceliklendirilmesi gereken operasyon kalemi var.' : 'Operasyon kuyruğu temiz görünüyor.'}
              </Typography>
              <Chip color={pendingTotal > 0 ? 'warning' : 'success'} icon={<WarningAmberOutlinedIcon />} label={pendingTotal > 0 ? 'Aksiyon gerekli' : 'Temiz'} sx={{ alignSelf: 'flex-start', fontWeight: 800 }} />
            </Stack>
          </Paper>
        }
      />

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xl: 'repeat(4, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))', sm: 'repeat(2, minmax(0, 1fr))', xs: '1fr' } }}>
        <Kpi label="Toplam Kullanıcı" value={dashboard.stats.totalUsers} icon={<GroupOutlinedIcon />} />
        <Kpi label="Aktif Öğrenci" value={dashboard.stats.activeStudents} icon={<SchoolOutlinedIcon />} />
        <Kpi label="Aktif Lisans" value={dashboard.stats.activeLicenses} icon={<AdminPanelSettingsOutlinedIcon />} />
        <Kpi label="Toplam Soru" value={dashboard.stats.totalQuestions} icon={<FactCheckOutlinedIcon />} />
        <Kpi label="Toplam Deneme" value={dashboard.stats.totalTrialExams} icon={<QuizOutlinedIcon />} />
        <Kpi label="Bugün Aktif" value={dashboard.stats.todayActiveUsers} icon={<TrendingUpOutlinedIcon />} />
        <Kpi label="Haftalık Kayıt" value={dashboard.stats.thisWeekNewUsers} icon={<GroupOutlinedIcon />} />
      </Box>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { lg: 'repeat(4, minmax(0, 1fr))', sm: 'repeat(2, minmax(0, 1fr))', xs: '1fr' } }}>
        <AdminMetricCard detail="Acik/islemde/kullanici bekleyen" icon={<SupportAgentOutlinedIcon />} label="Bekleyen Talepler" value={formatNumber(dashboard.supportTickets.pendingTickets)} />
        <AdminMetricCard detail="Henuz admin atanmamis" icon={<SupportAgentOutlinedIcon />} label="Atanmamis Talepler" value={formatNumber(dashboard.supportTickets.unassignedTickets)} />
        <AdminMetricCard detail="Bugun olusturulan" icon={<SupportAgentOutlinedIcon />} label="Bugun Acilan" value={formatNumber(dashboard.supportTickets.openedToday)} />
        <AdminMetricCard detail="Kritik ve kapanmamis" icon={<SupportAgentOutlinedIcon />} label="Kritik Talepler" value={formatNumber(dashboard.supportTickets.criticalTickets)} />
      </Box>

      <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { lg: '1.1fr 0.9fr 0.9fr', xs: '1fr' } }}>
        <PendingActionsPanel dashboard={dashboard} />
        <CompactList
          actionLabel="Tüm mesajlar"
          actionPath="/admin/contact-messages"
          emptyText="Yeni mesaj yok."
          icon={<MailOutlineOutlinedIcon color="primary" />}
          items={dashboard.recentMessages.map((message) => ({ title: message.subject, meta: `${message.senderName} · ${formatDate(message.createdAt)}` }))}
          title="Son İletişim Mesajları"
        />
        <ModerationPanel dashboard={dashboard} />
      </Box>

      <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { lg: '1fr 1fr', xs: '1fr' } }}>
        <CompactList
          actionLabel="Kullanıcıları gör"
          actionPath="/admin/access"
          emptyText="Kullanıcı kaydı yok."
          icon={<GroupOutlinedIcon color="primary" />}
          items={dashboard.recentUsers.map((user) => ({ title: user.displayName || user.email, meta: `${user.email} · ${formatDate(user.createdAt)}` }))}
          title="Yeni Kayıtlar"
        />
        <CompactList
          actionLabel="Erişimleri yönet"
          actionPath="/admin/access"
          emptyText="7 gün içinde bitecek erişim yok."
          icon={<AutorenewOutlinedIcon color="primary" />}
          items={dashboard.expiringAccesses.map((access) => ({
            title: access.userEmail || access.userId,
            meta: `${access.licenseName} · ${access.isExpired ? 'Süresi doldu' : formatDate(access.expiresAt)}`,
            tone: access.isExpired ? 'error' : 'warning',
          }))}
          title="Yakında Bitecek Erişimler"
        />
      </Box>

      <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { lg: '1fr 1fr 1fr', xs: '1fr' } }}>
        <OperationTiles dashboard={dashboard} />
        <LicenseAccessPanel dashboard={dashboard} />
        <SystemHealthPanel dashboard={dashboard} />
      </Box>

      <CriticalAlertsPanel alerts={dashboard.criticalAlerts} />
    </Stack>
  )
}

function Kpi({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return <AdminMetricCard detail="Canlı operasyon verisi" icon={icon} label={label} value={formatNumber(value)} />
}

function PendingActionsPanel({ dashboard }: { dashboard: AdminDashboard }) {
  const items = [
    { label: 'Bekleyen erişim talepleri', value: dashboard.pendingActions.pendingAccessRequests, path: '/admin/access-requests' },
    { label: 'Onay bekleyen içerikler', value: dashboard.pendingActions.pendingContentReviews, path: '/admin/moderation' },
    { label: 'Bugün sona eren erişimler', value: dashboard.pendingActions.expiredAccessesToday, path: '/admin/access' },
    { label: 'Başarısız import işlemleri', value: dashboard.pendingActions.failedImports, path: '/admin/import' },
    { label: 'Okunmamış mesajlar', value: dashboard.pendingActions.unreadMessages, path: '/admin/contact-messages' },
  ]

  return (
    <AdminSurface title="İşlem Bekleyen Öğeler" description="Adminin ilk bakışta aksiyon alması gereken operasyon kalemleri.">
      <Stack spacing={1.25}>
        {items.map((item) => (
          <Button
            component={RouterLink}
            key={item.label}
            sx={{
              gap: 1,
              justifyContent: 'space-between',
              minHeight: 48,
              px: 2,
              py: 1.2,
              textAlign: 'left',
              whiteSpace: 'normal',
            }}
            to={item.path}
            variant="outlined"
          >
            <Box component="span" sx={{ minWidth: 0 }}>
              {item.label}
            </Box>
            <Chip color={item.value > 0 ? 'warning' : 'success'} label={formatNumber(item.value)} size="small" />
          </Button>
        ))}
      </Stack>
    </AdminSurface>
  )
}

function ModerationPanel({ dashboard }: { dashboard: AdminDashboard }) {
  const queue = dashboard.moderationQueue
  return (
    <AdminSurface title="İçerik Moderasyonu" description="Yayın öncesi kontrol ve metadata eksikleri.">
      <Stack spacing={1}>
        <MiniRow label="Sorular" value={queue.pendingQuestions} to="/admin/questions" />
        <MiniRow label="Ders notları" value={queue.pendingStudyNotes} to="/admin/notes" />
        <MiniRow label="Materyaller" value={queue.pendingMaterials} to="/admin/sources" />
        <MiniRow label="Denemeler" value={queue.pendingTrialExams} to="/admin/trial-exams" />
        <MiniRow label="Taslak blog" value={queue.draftBlogPosts} to="/admin/blog" />
        <MiniRow label="Eksik SEO" value={queue.missingSeoMetadata} to="/admin/blog" tone="warning" />
      </Stack>
    </AdminSurface>
  )
}

function OperationTiles({ dashboard }: { dashboard: AdminDashboard }) {
  return (
    <AdminSurface title="İçerik ve Aktivite" description="Bu haftaki içerik üretimi ve bugünkü kullanıcı hareketi.">
      <Stack spacing={1.2}>
        <MiniMetric label="Bu hafta eklenen soru" value={dashboard.contentStats.questionsAddedThisWeek} />
        <MiniMetric label="Bu hafta eklenen deneme" value={dashboard.contentStats.trialExamsAddedThisWeek} />
        <MiniMetric label="Bu hafta eklenen materyal" value={dashboard.contentStats.materialsAddedThisWeek} />
        <MiniMetric label="Bugün çözülen soru" value={dashboard.userActivity.questionsSolvedToday} />
        <MiniMetric label="Bugün tamamlanan deneme" value={dashboard.userActivity.trialsCompletedToday} />
      </Stack>
    </AdminSurface>
  )
}

function LicenseAccessPanel({ dashboard }: { dashboard: AdminDashboard }) {
  const max = Math.max(...dashboard.licenseAccess.map((item) => item.activeStudentCount), 1)
  return (
    <AdminSurface title="Erişim Analizi" description="Lisans bazlı aktif öğrenci dağılımı.">
      {dashboard.licenseAccess.length === 0 ? (
        <EmptyState title="Lisans yok" description="Aktif lisans tanımlandığında erişim dağılımı burada görünür." />
      ) : (
        <Stack spacing={1.4}>
          {dashboard.licenseAccess.slice(0, 7).map((item) => (
            <Box key={item.licenseId}>
              <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                <Typography noWrap sx={{ fontWeight: 750 }}>{item.licenseName}</Typography>
                <Typography color="text.secondary">{formatNumber(item.activeStudentCount)}</Typography>
              </Stack>
              <LinearProgress sx={{ borderRadius: 999, height: 7, mt: 0.75 }} value={(item.activeStudentCount / max) * 100} variant="determinate" />
            </Box>
          ))}
        </Stack>
      )}
    </AdminSurface>
  )
}

function SystemHealthPanel({ dashboard }: { dashboard: AdminDashboard }) {
  const queues = dashboard.systemHealth.queues ?? []

  return (
    <AdminSurface title="Sistem Sağlığı" description={`Son kontrol: ${formatDate(dashboard.systemHealth.checkedAt)}`}>
      <Stack spacing={1.2}>
        <MiniMetric icon={<HealthAndSafetyOutlinedIcon color="success" />} label="API durumu" textValue={dashboard.systemHealth.apiStatus} />
        <MiniMetric label="Background jobs" value={dashboard.systemHealth.backgroundJobsQueued} />
        <MiniMetric label="Mail queue" value={dashboard.systemHealth.mailQueuePending} />
        <MiniMetric label="Import queue" value={dashboard.systemHealth.importQueuePending} />
        {queues.map((queue) => (
          <Box key={queue.name}>
            <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
              <Typography sx={{ fontWeight: 750 }}>{queue.name} queue</Typography>
              <Typography color="text.secondary">{queue.pendingCount}/{queue.capacity}</Typography>
            </Stack>
            <LinearProgress
              color={queue.usagePercent >= 95 ? 'error' : queue.usagePercent >= 80 ? 'warning' : 'primary'}
              sx={{ borderRadius: 999, height: 7, mt: 0.75 }}
              value={Math.min(100, queue.usagePercent)}
              variant="determinate"
            />
          </Box>
        ))}
      </Stack>
    </AdminSurface>
  )
}

function CriticalAlertsPanel({ alerts }: { alerts: AdminDashboard['criticalAlerts'] }) {
  return (
    <AdminSurface title="Kritik Uyarılar" description="Veri bütünlüğü, erişim ve yayın kalitesini etkileyebilecek durumlar.">
      {alerts.length === 0 ? (
        <EmptyState title="Kritik uyarı yok" description="İçerik ve erişim kontrolleri temiz görünüyor." />
      ) : (
        <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { md: 'repeat(2, 1fr)', xs: '1fr' } }}>
          {alerts.map((alert) => (
            <Paper key={`${alert.title}-${alert.targetPath}`} sx={{ borderRadius: 2, p: 2 }} variant="outlined">
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'flex-start' }}>
                <ErrorOutlineOutlinedIcon color={alert.severity === 'error' ? 'error' : 'warning'} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 850 }}>{alert.title}</Typography>
                  <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">{alert.description}</Typography>
                  <Button component={RouterLink} size="small" sx={{ mt: 1 }} to={alert.targetPath}>Aç</Button>
                </Box>
              </Stack>
            </Paper>
          ))}
        </Box>
      )}
    </AdminSurface>
  )
}

function CompactList({ actionLabel, actionPath, emptyText, icon, items, title }: {
  actionLabel: string
  actionPath: string
  emptyText: string
  icon: ReactNode
  items: Array<{ title: string; meta: string; tone?: 'error' | 'warning' }>
  title: string
}) {
  return (
    <AdminSurface title={title}>
      <Stack spacing={1.25}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          {icon}
          <Button component={RouterLink} size="small" to={actionPath}>{actionLabel}</Button>
        </Stack>
        {items.length === 0 ? (
          <Typography color="text.secondary">{emptyText}</Typography>
        ) : (
          items.slice(0, 10).map((item) => (
            <Paper key={`${item.title}-${item.meta}`} sx={{ borderRadius: 2, p: 1.5 }} variant="outlined">
              <Stack direction="row" sx={{ alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography noWrap sx={{ fontWeight: 800 }}>{item.title}</Typography>
                  <Typography color="text.secondary" noWrap variant="body2">{item.meta}</Typography>
                </Box>
                {item.tone && <Chip color={item.tone} label={item.tone === 'error' ? 'Kritik' : 'Yakında'} size="small" />}
              </Stack>
            </Paper>
          ))
        )}
      </Stack>
    </AdminSurface>
  )
}

function MiniRow({ label, to, tone = 'default', value }: { label: string; to: string; tone?: 'default' | 'warning'; value: number }) {
  return (
    <Button
      component={RouterLink}
      sx={{ gap: 1, justifyContent: 'space-between', textAlign: 'left', whiteSpace: 'normal' }}
      to={to}
      variant="text"
    >
      <Box component="span" sx={{ minWidth: 0 }}>
        {label}
      </Box>
      <Chip color={value > 0 ? (tone === 'warning' ? 'warning' : 'primary') : 'default'} label={formatNumber(value)} size="small" />
    </Button>
  )
}

function MiniMetric({ icon, label, textValue, value }: { icon?: ReactNode; label: string; textValue?: string; value?: number }) {
  return (
    <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        {icon || <Inventory2OutlinedIcon color="primary" fontSize="small" />}
        <Typography sx={{ fontWeight: 750 }}>{label}</Typography>
      </Stack>
      <Typography sx={{ fontWeight: 900 }}>{textValue ?? formatNumber(value ?? 0)}</Typography>
    </Stack>
  )
}
