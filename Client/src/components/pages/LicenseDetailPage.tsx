import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined'
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined'
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import { useQuery } from '@tanstack/react-query'
import { Alert, Box, Button, Chip, Container, Dialog, DialogActions, DialogContent, DialogTitle, LinearProgress, Paper, Skeleton, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { Link as RouterLink, useParams } from 'react-router'
import { selectIsAuthenticated } from '../../app/authSlice'
import { useAppSelector } from '../../app/hooks'
import { api } from '../../shared/api'
import { SeoHead } from '../../seo/SeoHead'
import { breadcrumbSchema, courseSchema, credentialSchema } from '../../seo/seoUtils'
import { useAccessRequestStore } from '../../stores/accessRequestStore'
import { AccessRequestModal } from '../../features/access-requests/AccessRequestModal'
import { MarketingHero } from '../common/MarketingHero'

function formatNumber(value: number) {
  return new Intl.NumberFormat('tr-TR').format(value)
}

function durationLabel(seconds: number) {
  return `${Math.max(1, Math.round(seconds / 60))} dk`
}

export function LicenseDetailPage() {
  const { slug } = useParams()
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const openModal = useAccessRequestStore((s) => s.openModal)
  const [authPromptOpen, setAuthPromptOpen] = useState(false)

  const licenseQuery = useQuery({
    enabled: Boolean(slug),
    queryKey: ['licenses', 'catalog', slug],
    queryFn: () => api.getLicenseCatalogBySlug(slug!),
    staleTime: 300_000,
  })

  const license = licenseQuery.data
  const plansQuery = useQuery({
    queryKey: ['plans'],
    queryFn: api.getPlans,
    staleTime: 300_000,
  })

  if (licenseQuery.isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 6 }}>
        <Skeleton height={260} variant="rounded" />
        <Skeleton height={360} sx={{ mt: 3 }} variant="rounded" />
      </Container>
    )
  }

  if (!license) {
    return (
      <Container maxWidth="xl" sx={{ py: 6 }}>
        <Alert severity="error">Lisans detayı yüklenemedi.</Alert>
      </Container>
    )
  }

  const description = license.description || license.shortDescription || `${license.name} lisansının güncel müfredat kapsamı.`
  const path = `/licenses/${license.slug}`
  const includedPlans = (plansQuery.data ?? []).filter((plan) =>
    plan.licenses.some((planLicense) => planLicense.id === license.id),
  )
  const requestPlan = includedPlans.find((plan) => !plan.hasAccess) ?? includedPlans[0]
  const schema = [
    courseSchema({
      name: license.name,
      description,
      path,
      courseCount: license.courseCount,
      topicCount: license.topicCount,
      questionCount: license.questionCount,
      estimatedStudyHours: license.estimatedStudyHours,
    }),
    credentialSchema({
      name: license.name,
      description,
      path,
    }),
    breadcrumbSchema([
      { name: 'Ana Sayfa', path: '/' },
      { name: 'Lisanslar', path: '/plans' },
      { name: license.name, path },
    ]),
  ]

  return (
    <Box sx={{ pb: { md: 8, xs: 5 } }}>
      <SeoHead
        canonical={path}
        description={description}
        image={license.iconUrl}
        schema={schema}
        title={`${license.name} Lisansı`}
      />
      <AccessRequestModal />
      <Dialog fullWidth maxWidth="xs" open={authPromptOpen} onClose={() => setAuthPromptOpen(false)}>
        <DialogTitle>Devam etmek için hesap gerekli</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Lisans müfredatını giriş yapmadan inceleyebilirsin. Eğitime başlamak ve erişim talebi oluşturmak için giriş yapman veya kayıt olman gerekir.
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
        eyebrow="Lisans Detayı"
        title={license.name}
        description={description}
      />

      <Container maxWidth="xl" sx={{ mt: { md: 6, xs: 4 } }}>
        <Stack direction={{ md: 'row', xs: 'column' }} spacing={1.5} sx={{ justifyContent: 'space-between', mb: 3 }}>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
            <Chip color={license.hasAccess ? 'success' : 'default'} icon={<LockOpenOutlinedIcon />} label={license.hasAccess ? 'Erişim aktif' : 'Erişim gerekli'} />
            <Chip label={`${formatNumber(license.estimatedStudyHours)} saat çalışma`} />
            <Chip label={`${formatNumber(license.analytics.activeStudentCount)} aktif öğrenci`} />
          </Stack>
          {license.hasAccess ? (
            <Button component={RouterLink} endIcon={<ArrowForwardOutlinedIcon />} to="/my-courses" variant="contained">
              Eğitime Git
            </Button>
          ) : isAuthenticated ? (
            <Button
              disabled={!requestPlan}
              onClick={() => requestPlan && openModal({
                licenses: requestPlan.licenses,
                planDescription: requestPlan.shortDescription || requestPlan.description,
                planId: requestPlan.id,
                planName: requestPlan.name,
                requestedLicenseName: license.name,
                scope: requestPlan.scope,
              })}
              variant="contained"
            >
              Erişim Talep Et
            </Button>
          ) : (
            <Button variant="contained" onClick={() => setAuthPromptOpen(true)}>
              Kayıt ol ve başvur
            </Button>
          )}
        </Stack>

        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { md: 'repeat(5, 1fr)', xs: 'repeat(2, 1fr)' } }}>
          {[
            ['Ders', license.courseCount],
            ['Konu', license.topicCount],
            ['Soru', license.questionCount],
            ['Deneme', license.quizCount],
            ['Materyal', license.materialCount],
          ].map(([label, value]) => (
            <Paper key={label} sx={{ borderRadius: 2, p: 2 }} variant="outlined">
              <Typography sx={{ fontWeight: 900 }} variant="h5">
                {formatNumber(Number(value))}
              </Typography>
              <Typography color="text.secondary">{label}</Typography>
            </Paper>
          ))}
        </Box>

        <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { lg: '1.2fr 0.8fr', xs: '1fr' }, mt: 3 }}>
          <Paper sx={{ borderRadius: 3, p: 3 }} variant="outlined">
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
              <SchoolOutlinedIcon color="primary" />
              <Typography sx={{ fontWeight: 900 }} variant="h6">Dersler</Typography>
            </Stack>
            <Stack spacing={2}>
              {license.courses.map((course) => (
                <Stack key={course.id} spacing={0.75}>
                  <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                    <Typography sx={{ fontWeight: 800 }}>{course.name}</Typography>
                    <Typography color="text.secondary">
                      {course.topicCount} konu · {formatNumber(course.questionCount)} soru
                    </Typography>
                  </Stack>
                  <LinearProgress
                    value={(course.questionCount / Math.max(license.questionCount, 1)) * 100}
                    variant="determinate"
                  />
                  {course.materialCount > 0 && (
                    <Typography color="text.secondary" variant="caption">
                      {course.materialCount} materyal
                    </Typography>
                  )}
                </Stack>
              ))}
            </Stack>
          </Paper>

          <Stack spacing={2.5}>
            <Paper sx={{ borderRadius: 3, p: 3 }} variant="outlined">
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
                <LockOpenOutlinedIcon color="primary" />
                <Typography sx={{ fontWeight: 900 }} variant="h6">Bu Lisansın Dahil Olduğu Paketler</Typography>
              </Stack>
              <Stack spacing={1}>
                {plansQuery.isLoading ? (
                  <Skeleton height={72} variant="rounded" />
                ) : includedPlans.length === 0 ? (
                  <Typography color="text.secondary">Bu lisans için aktif paket eşleşmesi bulunmuyor.</Typography>
                ) : (
                  includedPlans.map((plan) => (
                    <Stack direction="row" key={plan.id} spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
                        <CheckCircleOutlineOutlinedIcon color={plan.hasAccess ? 'success' : 'primary'} fontSize="small" />
                        <Typography noWrap sx={{ fontWeight: 750 }}>{plan.name}</Typography>
                      </Stack>
                      <Typography color="text.secondary" sx={{ flexShrink: 0 }} variant="body2">
                        {plan.licenses.length} lisans
                      </Typography>
                    </Stack>
                  ))
                )}
              </Stack>
            </Paper>

            <Paper sx={{ borderRadius: 3, p: 3 }} variant="outlined">
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
                <QuizOutlinedIcon color="primary" />
                <Typography sx={{ fontWeight: 900 }} variant="h6">Denemeler</Typography>
              </Stack>
              <Stack spacing={1.5}>
                {license.quizzes.length === 0 ? (
                  <Typography color="text.secondary">Yayınlanmış deneme bulunmuyor.</Typography>
                ) : (
                  license.quizzes.slice(0, 8).map((quiz) => (
                    <Stack direction="row" key={quiz.id} sx={{ justifyContent: 'space-between' }}>
                      <Typography variant="body2">{quiz.title}</Typography>
                      <Typography color="text.secondary" variant="body2">
                        {quiz.questionCount} soru · {durationLabel(quiz.duration)}
                      </Typography>
                    </Stack>
                  ))
                )}
              </Stack>
            </Paper>

            <Paper sx={{ borderRadius: 3, p: 3 }} variant="outlined">
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
                <ArticleOutlinedIcon color="primary" />
                <Typography sx={{ fontWeight: 900 }} variant="h6">Katalog Analitiği</Typography>
              </Stack>
              <Typography color="text.secondary">
                Ortalama başarı %{license.analytics.averageScore}; toplam kayıt {formatNumber(license.analytics.enrolledStudentCount)}.
              </Typography>
            </Paper>
          </Stack>
        </Box>
      </Container>
    </Box>
  )
}
