import { useState } from 'react'
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import InstagramIcon from '@mui/icons-material/Instagram'
import LinkedInIcon from '@mui/icons-material/LinkedIn'
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined'
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined'
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined'
import XIcon from '@mui/icons-material/X'
import { AppBar, Box, Button, Container, Divider, Drawer, IconButton, Link, Stack, Toolbar, Typography } from '@mui/material'
import { NavLink, Outlet } from 'react-router'
import { selectCurrentUser, selectIsAuthenticated } from '../../app/authSlice'
import { useAppSelector } from '../../app/hooks'
import { BrandMark } from '../../shared/branding/BrandMark'
import { useBranding } from '../../shared/branding/useBranding'
import { buildCopyright } from '../../shared/config/branding'

const navLinks = [
  { label: 'Ana Sayfa', path: '/' },
  { label: 'Özellikler', path: '/features' },
  { label: 'Soru Bankası', path: '/question-bank' },
  { label: 'Lisanslar', path: '/plans' },
  { label: 'Hakkımızda', path: '/about' },
  { label: 'İletişim', path: '/contact' },
]

const footerSections = [
  {
    title: 'Platform',
    links: [
      { label: 'Özellikler', path: '/features' },
      { label: 'Soru Bankası', path: '/question-bank' },
      { label: 'Lisanslar', path: '/plans' },
      { label: 'Ücretsiz Deneme', path: '/free-trial' },
      { label: 'Ders Notları', path: '/study-notes' },
    ],
  },
  {
    title: 'Kurumsal',
    links: [
      { label: 'Hakkımızda', path: '/about' },
      { label: 'İletişim', path: '/contact' },
      { label: 'Sık Sorulan Sorular', path: '/faq' },
      { label: 'Destek', path: '/support' },
    ],
  },
  {
    title: 'Yasal',
    links: [
      { label: 'KVKK', path: '/kvkk' },
      { label: 'Gizlilik Politikası', path: '/privacy' },
      { label: 'Kullanım Koşulları', path: '/terms' },
    ],
  },
]

export function MarketingLayout() {
  const user = useAppSelector(selectCurrentUser)
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const { appName, defaultDescription, supportEmail } = useBranding()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const dashboardPath = user?.role === 'Admin' ? '/admin' : '/dashboard'

  return (
    <Box sx={{ bgcolor: '#f7f9fb', color: '#0f172a', minHeight: '100vh' }}>
      <AppBar
        color="transparent"
        elevation={0}
        position="sticky"
        sx={{
          backdropFilter: 'blur(18px)',
          bgcolor: 'rgba(255,255,255,0.88)',
          borderBottom: '1px solid rgba(148,163,184,0.14)',
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ gap: 2, minHeight: 76 }}>
            <BrandMark subtitle="Sermaye piyasası lisans hazırlık sistemi" sx={{ flexGrow: 1 }} />

            <Stack direction="row" spacing={0.5} sx={{ display: { lg: 'flex', xs: 'none' } }}>
              {navLinks.map((link) => (
                <Button
                  component={NavLink}
                  key={link.path}
                  sx={{
                    color: 'text.secondary',
                    px: 1.5,
                    '&.active': {
                      color: 'primary.main',
                    },
                  }}
                  to={link.path}
                  variant="text"
                >
                  {link.label}
                </Button>
              ))}
            </Stack>

            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', display: { lg: 'flex', xs: 'none' } }}>
              {isAuthenticated ? (
                <Button component={NavLink} startIcon={<DashboardOutlinedIcon />} to={dashboardPath} variant="contained">
                  Panele Git
                </Button>
              ) : (
                <>
                  <Button component={NavLink} startIcon={<LoginOutlinedIcon />} to="/login" variant="text">
                    Giriş Yap
                  </Button>
                  <Button component={NavLink} startIcon={<RocketLaunchOutlinedIcon />} to="/register" variant="contained">
                    Ücretsiz Başla
                  </Button>
                </>
              )}
            </Stack>

            <IconButton aria-label="Menüyü aç" onClick={() => setIsMenuOpen(true)} sx={{ display: { lg: 'none', xs: 'inline-flex' } }}>
              <MenuOutlinedIcon />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer anchor="right" onClose={() => setIsMenuOpen(false)} open={isMenuOpen}>
        <Box sx={{ p: 2, width: 320 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography sx={{ fontWeight: 900 }}>Menü</Typography>
            <IconButton onClick={() => setIsMenuOpen(false)}>
              <CloseOutlinedIcon />
            </IconButton>
          </Stack>
          <Stack spacing={1}>
            {navLinks.map((link) => (
              <Button component={NavLink} key={link.path} onClick={() => setIsMenuOpen(false)} sx={{ justifyContent: 'flex-start' }} to={link.path} variant="text">
                {link.label}
              </Button>
            ))}
            <Divider sx={{ my: 1 }} />
            {isAuthenticated ? (
              <Button component={NavLink} onClick={() => setIsMenuOpen(false)} to={dashboardPath} variant="contained">
                Panele Git
              </Button>
            ) : (
              <>
                <Button component={NavLink} onClick={() => setIsMenuOpen(false)} to="/login" variant="outlined">
                  Giriş Yap
                </Button>
                <Button component={NavLink} onClick={() => setIsMenuOpen(false)} to="/register" variant="contained">
                  Ücretsiz Başla
                </Button>
              </>
            )}
          </Stack>
        </Box>
      </Drawer>

      <Box component="main">
        <Outlet />
      </Box>

      <Box component="footer" sx={{ bgcolor: '#0f172a', color: '#e5e7eb', mt: 8 }}>
        <Container maxWidth="xl" sx={{ py: 6 }}>
          <Box sx={{ display: 'grid', gap: 4, gridTemplateColumns: { lg: '1.2fr 1fr 1fr 1fr', md: '1fr 1fr', xs: '1fr' } }}>
            <Stack spacing={1.5}>
              <Typography sx={{ fontSize: 22, fontWeight: 900 }}>{appName}</Typography>
              <Typography sx={{ color: '#94a3b8', lineHeight: 1.8 }}>{defaultDescription}</Typography>
              <Stack direction="row" spacing={1.25}>
                <Link color="#cbd5e1" href="https://www.linkedin.com" target="_blank" underline="hover">
                  <LinkedInIcon fontSize="small" />
                </Link>
                <Link color="#cbd5e1" href="https://www.instagram.com" target="_blank" underline="hover">
                  <InstagramIcon fontSize="small" />
                </Link>
                <Link color="#cbd5e1" href="https://x.com" target="_blank" underline="hover">
                  <XIcon fontSize="small" />
                </Link>
              </Stack>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <EmailOutlinedIcon fontSize="small" />
                <Link color="#cbd5e1" href={`mailto:${supportEmail}`} underline="hover">
                  {supportEmail}
                </Link>
              </Stack>
            </Stack>

            {footerSections.map((section) => (
              <Stack key={section.title} spacing={1.25}>
                <Typography sx={{ fontWeight: 800 }}>{section.title}</Typography>
                {section.links.map((link) => (
                  <Link color="#cbd5e1" component={NavLink} key={link.path} to={link.path} underline="hover">
                    {link.label}
                  </Link>
                ))}
              </Stack>
            ))}
          </Box>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)', my: 4 }} />

          <Stack direction={{ md: 'row', xs: 'column' }} spacing={1.5} sx={{ alignItems: { md: 'center', xs: 'flex-start' }, justifyContent: 'space-between' }}>
            <Typography color="#94a3b8" variant="body2">
              {buildCopyright()}
            </Typography>
            <Typography color="#94a3b8" variant="body2">
              Public site ile öğrenci ve admin deneyimi ayrı arayüz katmanlarıyla çalışır.
            </Typography>
          </Stack>
        </Container>
      </Box>
    </Box>
  )
}

export interface MarketingSeoHandle {
  description: string
  keywords?: string
  title: string
}
