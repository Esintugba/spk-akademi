import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import SettingsSuggestOutlinedIcon from '@mui/icons-material/SettingsSuggestOutlined'
import {
  AppBar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  Paper,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { Outlet, useNavigate, useOutletContext } from 'react-router'
import { toast } from 'react-toastify'
import type { AppOutletContext } from '../../App'
import { logout, selectCurrentUser } from '../../app/authSlice'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { AppBreadcrumbs } from '../common/AppBreadcrumbs'
import { NavLinks } from './NavLinks'
import { BrandMark } from '../../shared/branding/BrandMark'

const drawerWidth = 300

export function AdminLayout() {
  const appContext = useOutletContext<AppOutletContext>()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const user = useAppSelector(selectCurrentUser)
  const [mobileOpen, setMobileOpen] = useState(false)

  const displayName = useMemo(() => user?.email?.split('@')[0] || 'Admin', [user?.email])

  function handleLogout() {
    dispatch(logout())
    toast.success('Çıkış yapıldı.')
    navigate('/login')
  }

  const drawerContent = (
    <Stack sx={{ height: '100%' }}>
      <Toolbar sx={{ minHeight: 92, px: 3 }}>
        <BrandMark subtitle="Admin operasyon merkezi" variant="light" />
      </Toolbar>

      <NavLinks />

      <Box sx={{ mt: 'auto', p: 2.5 }}>
        <Paper
          sx={{
            bgcolor: 'rgba(15,23,42,0.5)',
            border: '1px solid rgba(148,163,184,0.12)',
            borderRadius: 3,
            p: 2,
          }}
          variant="outlined"
        >
          <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
            <Box
              sx={{
                alignItems: 'center',
                bgcolor: 'rgba(59,130,246,0.16)',
                borderRadius: 2,
                color: '#93c5fd',
                display: 'flex',
                height: 38,
                justifyContent: 'center',
                width: 38,
              }}
            >
              <SettingsSuggestOutlinedIcon fontSize="small" />
            </Box>
            <Box>
              <Typography sx={{ color: '#e2e8f0', fontSize: 13, fontWeight: 800 }}>
                Moderasyon açık
              </Typography>
              <Typography sx={{ color: '#94a3b8', fontSize: 12 }}>
                İçerikler onay akışıyla yayınlanır.
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Box>
    </Stack>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <AppBar
        color="transparent"
        elevation={0}
        position="fixed"
        sx={{
          backdropFilter: 'blur(14px)',
          bgcolor: 'rgba(248,250,252,0.82)',
          borderBottom: '1px solid rgba(148,163,184,0.14)',
          display: { md: 'none', xs: 'block' },
        }}
      >
        <Toolbar sx={{ minHeight: 72 }}>
          <IconButton edge="start" onClick={() => setMobileOpen(true)}>
            <MenuRoundedIcon />
          </IconButton>
          <Typography sx={{ fontSize: 18, fontWeight: 900, ml: 1 }}>Admin Paneli</Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        slotProps={{
          paper: {
            sx: {
              background: 'linear-gradient(180deg, #0f172a 0%, #111827 100%)',
              color: '#f9fafb',
              borderRight: 0,
            },
          },
        }}
        sx={{
          display: { md: 'block', xs: 'none' },
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
          },
        }}
        variant="permanent"
      >
        {drawerContent}
      </Drawer>

      <Drawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        slotProps={{
          paper: {
            sx: {
              background: 'linear-gradient(180deg, #0f172a 0%, #111827 100%)',
              color: '#f9fafb',
              width: drawerWidth,
            },
          },
        }}
        sx={{ display: { md: 'none', xs: 'block' } }}
        variant="temporary"
      >
        {drawerContent}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          px: { md: 4, xs: 2 },
          py: { md: 4, xs: 2 },
          pt: { md: 4, xs: 11 },
        }}
      >
        {user && (
          <Paper sx={{ borderRadius: 4, mb: 3, p: { md: 2.5, xs: 2 } }} variant="outlined">
            <Stack
              direction={{ sm: 'row', xs: 'column' }}
              spacing={1.5}
              sx={{ alignItems: { sm: 'center', xs: 'flex-start' }, justifyContent: 'space-between' }}
            >
              <Box>
                <Typography sx={{ fontSize: 22, fontWeight: 900 }}>
                  Hoş geldin, {displayName}
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  İçerik operasyonlarını, moderasyonu ve erişimleri bu panelden yönetebilirsin.
                </Typography>
              </Box>

              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                <Box sx={{ display: { md: 'block', xs: 'none' } }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{user.email}</Typography>
                  <Typography color="text.secondary" sx={{ fontSize: 12 }}>
                    Yetki: Admin
                  </Typography>
                </Box>
                <Divider flexItem orientation="vertical" sx={{ display: { md: 'block', xs: 'none' } }} />
                <Button color="inherit" size="small" startIcon={<LogoutOutlinedIcon />} variant="outlined" onClick={handleLogout}>
                  Çıkış
                </Button>
              </Stack>
            </Stack>
          </Paper>
        )}
        <Box sx={{ maxWidth: 1280 }}>
          <AppBreadcrumbs area="admin" />
          <Outlet context={appContext} />
        </Box>
      </Box>
    </Box>
  )
}
