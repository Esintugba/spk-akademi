import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined'
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined'
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import { useQuery } from '@tanstack/react-query'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { Link as RouterLink } from 'react-router'
import { selectCurrentUser, selectIsAuthenticated } from '../../app/authSlice'
import { useAppSelector } from '../../app/hooks'
import type { Plan } from '../../models'
import { AccessRequestStatus } from '../../models/accessRequest'
import { AccessRequestModal } from '../../features/access-requests/AccessRequestModal'
import { accessRequestApi, api } from '../../shared/api'
import { SeoHead } from '../../seo/SeoHead'
import { courseSchema } from '../../seo/seoUtils'
import { useAccessRequestStore } from '../../stores/accessRequestStore'
import { MarketingHero } from '../common/MarketingHero'
import { MarketingSectionHeading } from '../common/MarketingSectionHeading'
import { marketingCardSx, marketingPageSx, marketingSectionSx } from '../common/marketingStyles'

function formatNumber(value: number) {
  return new Intl.NumberFormat('tr-TR').format(value)
}

function accessLabel(plan: Plan, pending: boolean) {
  if (plan.hasAccess) {
    return 'Aktif erişim'
  }

  if (plan.activeLicenseCount > 0) {
    return `${plan.activeLicenseCount}/${plan.licenses.length} lisans açık`
  }

  return pending ? 'Başvuru bekliyor' : 'Erişim gerekli'
}

export function PlansPage() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const currentUser = useAppSelector(selectCurrentUser)
  const isStudent = currentUser?.role === 'Student'
  const openModal = useAccessRequestStore((s) => s.openModal)
  const [authPromptOpen, setAuthPromptOpen] = useState(false)

  const plansQuery = useQuery({
    queryKey: ['plans'],
    queryFn: api.getPlans,
    staleTime: 300_000,
  })

  const requestsQuery = useQuery({
    enabled: isAuthenticated && isStudent,
    queryKey: ['access-requests', 'me'],
    queryFn: accessRequestApi.getMy,
    staleTime: 60_000,
  })

  const pendingByPlanId = new Map<string, boolean>()
  for (const request of requestsQuery.data ?? []) {
    if (request.status === AccessRequestStatus.Pending || request.status === AccessRequestStatus.Waitlisted) {
      pendingByPlanId.set(request.planId, true)
    }
  }

  const plans = plansQuery.data ?? []
  const schema = plans.slice(0, 12).map((plan) =>
    courseSchema({
      name: plan.name,
      description: plan.shortDescription || plan.description || `${plan.name} SPK hazırlık paketi.`,
      path: '/plans',
      courseCount: plan.scope.courseCount,
      topicCount: plan.scope.topicCount,
      questionCount: plan.scope.questionCount,
      estimatedStudyHours: plan.scope.estimatedStudyHours,
    }),
  )

  return (
    <Box sx={marketingPageSx}>
      <SeoHead
        canonical="/plans"
        description="SPK paketlerini dahil ettikleri lisanslar, dersler, konular, soru bankası, deneme ve materyal kapsamı ile inceleyin."
        schema={schema}
        title="SPK Paketleri ve Lisans Kapsamı"
      />
      <AccessRequestModal />
      <Dialog fullWidth maxWidth="xs" open={authPromptOpen} onClose={() => setAuthPromptOpen(false)}>
        <DialogTitle>Devam etmek için hesap gerekli</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Paket kapsamını herkes inceleyebilir. Erişim talebi oluşturmak ve ilerlemeni takip etmek için giriş yapman veya hesap oluşturman gerekir.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button component={RouterLink} to="/login" onClick={() => setAuthPromptOpen(false)}>
            Giriş Yap
          </Button>
          <Button component={RouterLink} to="/register" variant="contained" onClick={() => setAuthPromptOpen(false)}>
            Kayıt Ol
          </Button>
        </DialogActions>
      </Dialog>

      <MarketingHero
        eyebrow="Paket ve Lisans Kapsamı"
        title="Her paketin açtığı lisansları tek bakışta gör."
        description="Paket kartları hangi lisansları, kaç dersi, kaç konuyu, kaç soruyu ve kaç denemeyi açtığını canlı katalog verisiyle gösterir."
      />

      <Container maxWidth="xl" sx={marketingSectionSx}>
        {isAuthenticated && (
          <Stack sx={{ alignItems: 'flex-end', mb: 2 }}>
            <Button component={RouterLink} to="/dashboard/access-requests" variant="text">
              Başvurularımı gör
            </Button>
          </Stack>
        )}

        <MarketingSectionHeading
          eyebrow="Paketler"
          title="Erişim kapsamını net seç"
          description="Lisans eşleşmeleri backend modelinden gelir; kartlardaki toplamlar dahil edilen lisansların gerçek içerik sayılarından hesaplanır."
        />

        {plansQuery.isLoading ? (
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { md: 'repeat(3, 1fr)', xs: '1fr' } }}>
            {[1, 2, 3].map((item) => (
              <Skeleton height={460} key={item} variant="rounded" />
            ))}
          </Box>
        ) : plansQuery.error instanceof Error ? (
          <Alert severity="error">{plansQuery.error.message}</Alert>
        ) : plans.length === 0 ? (
          <Alert severity="info">Henüz aktif paket tanımlanmadı.</Alert>
        ) : (
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { lg: 'repeat(3, minmax(0, 1fr))', md: 'repeat(2, minmax(0, 1fr))', xs: '1fr' } }}>
            {plans.map((plan) => {
              const hasPending = pendingByPlanId.get(plan.id) ?? false
              const visibleLicenses = plan.licenses.slice(0, 4)

              return (
                <Paper key={plan.id} sx={{ ...marketingCardSx, display: 'flex', flexDirection: 'column' }} variant="outlined">
                  <Stack spacing={2} sx={{ flexGrow: 1 }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                      <Inventory2OutlinedIcon color="primary" />
                      <Chip
                        color={plan.hasAccess ? 'success' : hasPending ? 'warning' : 'default'}
                        label={accessLabel(plan, hasPending)}
                        size="small"
                      />
                    </Stack>

                    <Box>
                      <Typography sx={{ fontSize: 24, fontWeight: 900 }}>{plan.name}</Typography>
                      <Typography color="text.secondary" sx={{ lineHeight: 1.75, mt: 1 }}>
                        {plan.shortDescription || plan.description || 'Bu paket için açıklama yakında eklenecek.'}
                      </Typography>
                    </Box>

                    <Stack spacing={0.75}>
                      {visibleLicenses.map((license) => (
                        <Stack direction="row" key={license.id} spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
                          <CheckCircleOutlineOutlinedIcon color={license.hasAccess ? 'success' : 'primary'} fontSize="small" />
                          <Typography noWrap sx={{ fontWeight: 700 }} variant="body2">
                            {license.name}
                          </Typography>
                        </Stack>
                      ))}
                      {plan.licenses.length > visibleLicenses.length && (
                        <Typography color="text.secondary" variant="body2">
                          +{plan.licenses.length - visibleLicenses.length} lisans daha
                        </Typography>
                      )}
                    </Stack>

                    <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                      <MetricTile label="Ders" value={plan.scope.courseCount} />
                      <MetricTile label="Konu" value={plan.scope.topicCount} />
                      <MetricTile label="Soru" value={plan.scope.questionCount} />
                      <MetricTile label="Deneme" value={plan.scope.quizCount} />
                      <MetricTile label="Materyal" value={plan.scope.materialCount} />
                      <MetricTile label="Saat" value={plan.scope.estimatedStudyHours} />
                    </Box>

                    <Accordion
                      disableGutters
                      elevation={0}
                      sx={{
                        border: '1px solid rgba(148,163,184,0.16)',
                        borderRadius: '8px !important',
                        '&:before': { display: 'none' },
                      }}
                    >
                      <AccordionSummary expandIcon={<ExpandMoreOutlinedIcon />}>
                        <Typography sx={{ fontWeight: 800 }}>Lisansları Gör</Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ maxHeight: 280, overflowY: 'auto', pt: 0 }}>
                        <Stack spacing={1.25}>
                          {plan.licenses.map((license) => (
                            <Box key={license.id} sx={{ borderTop: '1px solid rgba(148,163,184,0.14)', pt: 1.25 }}>
                              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                                <Typography sx={{ fontWeight: 850 }}>{license.name}</Typography>
                                {license.hasAccess && <Chip color="success" label="Açık" size="small" />}
                              </Stack>
                              <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">
                                {license.courseCount} ders · {license.topicCount} konu · {formatNumber(license.questionCount)} soru · {license.quizCount} deneme
                              </Typography>
                            </Box>
                          ))}
                        </Stack>
                      </AccordionDetails>
                    </Accordion>
                  </Stack>

                  <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1.25} sx={{ mt: 3 }}>
                    <Button component={RouterLink} fullWidth to={plan.licenses[0] ? `/licenses/${plan.licenses[0].slug}` : '/licenses'} variant="outlined">
                      Lisans Detayı
                    </Button>
                    {plan.hasAccess ? (
                      <Button component={RouterLink} fullWidth to="/my-courses" variant="contained">
                        Eğitime Git
                      </Button>
                    ) : isAuthenticated ? (
                      <Button
                        disabled={hasPending}
                        fullWidth
                        onClick={() => openModal({
                          licenses: plan.licenses,
                          planDescription: plan.shortDescription || plan.description,
                          planId: plan.id,
                          planName: plan.name,
                          scope: plan.scope,
                        })}
                        variant="contained"
                      >
                        {hasPending ? 'Başvuru inceleniyor' : 'Erişim Talep Et'}
                      </Button>
                    ) : (
                      <Button fullWidth variant="contained" onClick={() => setAuthPromptOpen(true)}>
                        Kayıt ol ve başvur
                      </Button>
                    )}
                  </Stack>
                </Paper>
              )
            })}
          </Box>
        )}

        <Stack direction={{ md: 'row', xs: 'column' }} spacing={1.5} sx={{ mt: 4 }}>
          <Button
            component={isAuthenticated ? RouterLink : 'button'}
            endIcon={<ArrowForwardOutlinedIcon />}
            to={isAuthenticated ? '/dashboard/access-requests' : undefined}
            variant="contained"
            onClick={() => {
              if (!isAuthenticated) {
                setAuthPromptOpen(true)
              }
            }}
          >
            Hesap oluştur
          </Button>
          <Button component={RouterLink} to="/contact" variant="outlined">
            Kurumsal erişim için iletişime geç
          </Button>
        </Stack>
      </Container>
    </Box>
  )
}

function MetricTile({ label, value }: { label: string; value: number }) {
  return (
    <Box
      sx={{
        bgcolor: 'rgba(15,23,42,0.035)',
        border: '1px solid rgba(148,163,184,0.16)',
        borderRadius: 2,
        minWidth: 0,
        p: 1.25,
      }}
    >
      <Typography noWrap sx={{ fontSize: 18, fontWeight: 900 }}>
        {formatNumber(value)}
      </Typography>
      <Typography color="text.secondary" noWrap sx={{ fontSize: 11, fontWeight: 700 }}>
        {label}
      </Typography>
    </Box>
  )
}
