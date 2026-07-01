import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined'
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined'
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import SearchOffRoundedIcon from '@mui/icons-material/SearchOffRounded'
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined'
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import { Box, Button, Container, Divider, Link, Paper, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router'
import { BrandMark } from '../../shared/branding/BrandMark'
import { useBranding } from '../../shared/branding/useBranding'
import { SeoHead } from '../../seo/SeoHead'
import { useLocalization } from '../../shared/localization'
import { LanguageSwitch } from './LanguageSwitch'

type ErrorVariant = 'notFound' | 'forbidden' | 'server' | 'data' | 'generic'

interface ErrorStatePageProps {
  code?: string
  description: string
  details?: string
  eyebrow?: string
  primaryAction?: ReactNode
  secondaryAction?: ReactNode
  title: string
  variant?: ErrorVariant
}

const variantMeta: Record<ErrorVariant, { icon: ReactNode; tone: string }> = {
  notFound: { icon: <SearchOffRoundedIcon />, tone: '#2563eb' },
  forbidden: { icon: <ShieldOutlinedIcon />, tone: '#b45309' },
  server: { icon: <WarningAmberRoundedIcon />, tone: '#dc2626' },
  data: { icon: <RefreshRoundedIcon />, tone: '#0f766e' },
  generic: { icon: <WarningAmberRoundedIcon />, tone: '#7c3aed' },
}

export function ErrorStatePage({
  code,
  description,
  details,
  eyebrow = 'Sayfa durumu',
  primaryAction,
  secondaryAction,
  title,
  variant = 'generic',
}: ErrorStatePageProps) {
  const navigate = useNavigate()
  const { supportEmail } = useBranding()
  const { t } = useLocalization()
  const meta = variantMeta[variant]
  const translatedTitle = t(title)
  const translatedDescription = t(description)

  return (
    <Box sx={{ bgcolor: '#f7f9fb', minHeight: '100vh' }}>
      <SeoHead description={translatedDescription} noIndex title={translatedTitle} />
      <Container maxWidth="lg" sx={{ py: { md: 5, xs: 2 }, px: { xs: 1.5, sm: 3 } }}>
        <Stack spacing={{ md: 4, xs: 2.5 }}>
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', minWidth: 0 }}>
            <BrandMark subtitle={t('Sermaye piyasası lisans hazırlık sistemi')} to="/" />
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexShrink: 0 }}>
              <LanguageSwitch />
              <Button component={RouterLink} startIcon={<HomeOutlinedIcon />} sx={{ display: { sm: 'inline-flex', xs: 'none' } }} to="/" variant="text">
                {t('Ana Sayfa')}
              </Button>
            </Stack>
          </Stack>

          <Paper
            elevation={0}
            sx={{
              border: '1px solid rgba(148,163,184,0.18)',
              borderRadius: { md: 4, xs: 3 },
              overflow: 'hidden',
              position: 'relative',
            }}
            variant="outlined"
          >
            <Box
              sx={{
                bgcolor: 'rgba(255,255,255,0.82)',
                display: 'grid',
                gap: { md: 5, xs: 3 },
                gridTemplateColumns: { md: 'minmax(0, 0.78fr) minmax(0, 1.22fr)', xs: '1fr' },
                p: { md: 5, xs: 2.5 },
              }}
            >
              <Stack spacing={2.5}>
                <Box
                  sx={{
                    alignItems: 'center',
                    bgcolor: `${meta.tone}14`,
                    border: `1px solid ${meta.tone}30`,
                    borderRadius: 3,
                    color: meta.tone,
                    display: 'flex',
                    height: 72,
                    justifyContent: 'center',
                    width: 72,
                    '& svg': { fontSize: 38 },
                  }}
                >
                  {meta.icon}
                </Box>
                <Box>
                  <Typography color="text.secondary" sx={{ fontSize: 13, fontWeight: 900, letterSpacing: 0, textTransform: 'uppercase' }}>
                    {t(eyebrow)}
                  </Typography>
                  {code && (
                    <Typography sx={{ color: meta.tone, fontSize: { md: 76, xs: 48 }, fontWeight: 950, lineHeight: 1, mt: 1 }}>
                      {code}
                    </Typography>
                  )}
                </Box>
              </Stack>

              <Stack spacing={2.25} sx={{ justifyContent: 'center', minWidth: 0 }}>
                <Typography component="h1" sx={{ fontSize: { md: 42, xs: 28 }, fontWeight: 950, lineHeight: 1.08 }}>
                  {translatedTitle}
                </Typography>
                <Typography color="text.secondary" sx={{ fontSize: { md: 18, xs: 16 }, lineHeight: 1.8, maxWidth: 720 }}>
                  {translatedDescription}
                </Typography>
                {details && (
                  <Box
                    sx={{
                      bgcolor: 'rgba(15,23,42,0.035)',
                      border: '1px solid rgba(148,163,184,0.18)',
                      borderRadius: 2,
                      p: 1.5,
                    }}
                  >
                    <Typography color="text.secondary" sx={{ overflowWrap: 'anywhere' }} variant="body2">
                      {t(details)}
                    </Typography>
                  </Box>
                )}

                <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1.25} sx={{ pt: 0.5 }}>
                  {primaryAction ?? (
                    <Button component={RouterLink} startIcon={<HomeOutlinedIcon />} to="/" variant="contained">
                      {t('Ana sayfaya dön')}
                    </Button>
                  )}
                  {secondaryAction ?? (
                    <Button onClick={() => navigate(-1)} startIcon={<ArrowBackRoundedIcon />} variant="outlined">
                      {t('Önceki sayfa')}
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Box>

            <Divider />

            <Stack
              direction={{ md: 'row', xs: 'column' }}
              spacing={1.5}
              sx={{
                alignItems: { md: 'center', xs: 'flex-start' },
                bgcolor: '#0f172a',
                color: '#cbd5e1',
                justifyContent: 'space-between',
                p: { md: 2.5, xs: 2 },
              }}
            >
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <SupportAgentOutlinedIcon fontSize="small" />
                <Typography variant="body2">{t('Sorun devam ederse destek ekibine iletin.')}</Typography>
              </Stack>
              <Link color="#e2e8f0" href={`mailto:${supportEmail}`} sx={{ alignItems: 'center', display: 'inline-flex', gap: 0.75 }} underline="hover">
                <MailOutlineRoundedIcon fontSize="small" />
                {supportEmail}
              </Link>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  )
}

export function LoginAction() {
  const { t } = useLocalization()

  return (
    <Button component={RouterLink} startIcon={<LoginOutlinedIcon />} to="/login" variant="contained">
      {t('Giriş yap')}
    </Button>
  )
}
