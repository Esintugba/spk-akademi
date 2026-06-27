import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material'
import { cloneElement, useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate, useOutletContext } from 'react-router'
import { toast } from 'react-toastify'
import type { AppOutletContext } from '../../App'
import { logout, selectCurrentUser } from '../../app/authSlice'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { AchievementCelebrationLayer } from '../../features/gamification/AchievementCelebrationLayer'
import { ResumeQuizModal } from '../../features/quiz-session/ResumeQuizModal'
import { AppBreadcrumbs } from '../common/AppBreadcrumbs'
import { gamificationApi } from '../../shared/api'
import { studentNavigation, type StudentNavItem } from '../../shared/navigation'
import { BrandMark } from '../../shared/branding/BrandMark'
import { useLocalization } from '../../shared/localization'

const expandedDrawerWidth = 292
const collapsedDrawerWidth = 76

function isItemActive(pathname: string, item: StudentNavItem) {
  if (item.exactMatchPaths?.some((matchPath) => pathname === matchPath)) {
    return true
  }

  const matchPaths = item.matchPaths ?? [item.path]

  return matchPaths.some((matchPath) => {
    if (matchPath === '/') {
      return pathname === '/'
    }

    return pathname === matchPath || pathname.startsWith(matchPath.endsWith('/') ? matchPath : `${matchPath}/`)
  })
}

type StudentNavigationContentProps = {
  collapsed: boolean
  onNavigate?: () => void
}

function StudentNavigationContent({ collapsed, onNavigate }: StudentNavigationContentProps) {
  const location = useLocation()
  const { t } = useLocalization()

  return (
    <Stack sx={{ height: '100%', minHeight: 0 }}>
      <Toolbar sx={{ minHeight: 88, px: collapsed ? 1.5 : 2.5 }}>
        {collapsed ? (
          <Tooltip title="SPK Akademi" placement="right">
            <Box
              aria-label="SPK Akademi"
              sx={{
                alignItems: 'center',
                background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                borderRadius: 2,
                color: '#fff',
                display: 'flex',
                fontSize: 12,
                fontWeight: 900,
                height: 42,
                justifyContent: 'center',
                width: 42,
              }}
            >
              SPK
            </Box>
          </Tooltip>
        ) : (
          <BrandMark subtitle={t('Öğrenci çalışma merkezi')} variant="light" />
        )}
      </Toolbar>

      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', px: collapsed ? 1 : 1.5, pb: 2 }}>
        {studentNavigation.map((section) => (
          <Box key={section.id} sx={{ mb: 1.75 }}>
            {section.label && !collapsed && (
              <Typography
                sx={{
                  color: '#94a3b8',
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: 0,
                  mb: 0.75,
                  px: 1.25,
                }}
              >
                {t(section.label)}
              </Typography>
            )}

            <List disablePadding>
              {section.items.map((item) => {
                const active = isItemActive(location.pathname, item)
                const icon = cloneElement(item.icon, { fontSize: 'small' })
                const button = (
                  <ListItemButton
                    aria-current={active ? 'page' : undefined}
                    component={item.disabled ? 'button' : NavLink}
                    disabled={item.disabled}
                    key={item.id}
                    onClick={onNavigate}
                    to={item.disabled ? undefined : item.path}
                    sx={{
                      borderRadius: 2,
                      color: active ? '#ffffff' : '#dbe4f0',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      mb: 0.5,
                      minHeight: 44,
                      opacity: item.disabled ? 0.55 : 1,
                      px: collapsed ? 1 : 1.25,
                      py: 1,
                      textDecoration: 'none',
                      '& .MuiListItemText-primary': {
                        fontSize: 14,
                        fontWeight: active ? 900 : 700,
                      },
                      '&.Mui-disabled': {
                        color: '#94a3b8',
                        opacity: 0.55,
                      },
                      '&:hover': {
                        bgcolor: item.disabled ? 'transparent' : 'rgba(51,65,85,0.88)',
                        color: '#ffffff',
                      },
                      ...(active && {
                        bgcolor: 'rgba(20,184,166,0.18)',
                        boxShadow: 'inset 3px 0 0 #2dd4bf',
                      }),
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: 'inherit',
                        justifyContent: 'center',
                        minWidth: collapsed ? 0 : 38,
                      }}
                    >
                      {item.badgeLabel ? (
                        <Badge badgeContent={item.badgeLabel} color="warning">
                          {icon}
                        </Badge>
                      ) : (
                        icon
                      )}
                    </ListItemIcon>

                    {!collapsed && (
                      <>
                        <ListItemText primary={t(item.label)} />
                        {item.disabled && <Chip label={t('Yakında')} size="small" sx={{ height: 22, fontSize: 11 }} />}
                      </>
                    )}
                  </ListItemButton>
                )

                return collapsed ? (
                  <Tooltip key={item.id} title={item.disabled ? `${t(item.label)} ${t('yakında')}` : t(item.label)} placement="right">
                    <Box>{button}</Box>
                  </Tooltip>
                ) : (
                  button
                )
              })}
            </List>
          </Box>
        ))}
      </Box>
    </Stack>
  )
}

export function StudentLayout() {
  const appContext = useOutletContext<AppOutletContext>()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const user = useAppSelector(selectCurrentUser)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const { t } = useLocalization()

  const displayName = useMemo(() => user?.email?.split('@')[0] || 'Öğrenci', [user?.email])
  const userInitial = displayName.charAt(0).toUpperCase()
  const drawerWidth = collapsed ? collapsedDrawerWidth : expandedDrawerWidth

  useEffect(() => {
    if (!user) {
      return
    }

    void gamificationApi.claimDailyLogin().catch(() => undefined)
  }, [user])

  function handleLogout() {
    dispatch(logout())
    toast.success(t('Çıkış yapıldı.'))
    navigate('/login')
  }

  return (
    <Box sx={{ bgcolor: 'background.default', display: 'flex', minHeight: '100vh' }}>
      <AppBar
        color="transparent"
        elevation={0}
        position="fixed"
        sx={{
          backdropFilter: 'blur(14px)',
          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(15,23,42,0.88)' : 'rgba(248,250,252,0.88)',
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          display: { md: 'none', xs: 'block' },
        }}
      >
        <Toolbar sx={{ minHeight: 68, px: 2 }}>
          <IconButton aria-label={t('Menüyü aç')} edge="start" onClick={() => setMobileOpen(true)}>
            <MenuRoundedIcon />
          </IconButton>
          <Box sx={{ flex: 1, ml: 1, minWidth: 0 }}>
            <Typography noWrap sx={{ fontSize: 17, fontWeight: 900 }}>
              {t('Öğrenci Paneli')}
            </Typography>
            <Typography noWrap color="text.secondary" sx={{ fontSize: 12 }}>
              {t('Ders, test ve tekrar merkezi')}
            </Typography>
          </Box>
          <Avatar
            sx={{
              background: 'linear-gradient(135deg, #14b8a6 0%, #2563eb 100%)',
              fontSize: 14,
              fontWeight: 900,
              height: 36,
              width: 36,
            }}
          >
            {userInitial}
          </Avatar>
        </Toolbar>
      </AppBar>

      <Drawer
        slotProps={{
          paper: {
            sx: {
              background: 'linear-gradient(180deg, #0f172a 0%, #111827 100%)',
              borderRight: 0,
              boxSizing: 'border-box',
              color: '#f8fafc',
              overflowX: 'hidden',
              transition: (theme) =>
                theme.transitions.create('width', {
                  duration: theme.transitions.duration.shorter,
                  easing: theme.transitions.easing.sharp,
                }),
              width: drawerWidth,
            },
          },
        }}
        sx={{
          display: { md: 'block', xs: 'none' },
          flexShrink: 0,
          width: drawerWidth,
        }}
        variant="permanent"
      >
        <StudentNavigationContent collapsed={collapsed} />

        <Box sx={{ borderTop: '1px solid rgba(148,163,184,0.14)', p: collapsed ? 1 : 2 }}>
          <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between' }}>
            {!collapsed && (
              <Box sx={{ minWidth: 0 }}>
                <Typography noWrap sx={{ color: '#f8fafc', fontSize: 13, fontWeight: 900 }}>
                  {displayName}
                </Typography>
                <Typography noWrap sx={{ color: '#94a3b8', fontSize: 12 }}>
                  {t('Öğrenci hesabı')}
                </Typography>
              </Box>
            )}
            <Tooltip title={t(collapsed ? 'Menüyü genişlet' : 'Menüyü daralt')}>
              <IconButton
                aria-expanded={!collapsed}
                aria-label={t(collapsed ? 'Menüyü genişlet' : 'Menüyü daralt')}
                onClick={() => setCollapsed((value) => !value)}
                sx={{ color: '#cbd5e1' }}
              >
                {collapsed ? <ChevronRightRoundedIcon /> : <ChevronLeftRoundedIcon />}
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
      </Drawer>

      <Drawer
        onClose={() => setMobileOpen(false)}
        open={mobileOpen}
        slotProps={{
          paper: {
            sx: {
              background: 'linear-gradient(180deg, #0f172a 0%, #111827 100%)',
              borderRight: 0,
              color: '#f8fafc',
              width: expandedDrawerWidth,
            },
          },
        }}
        sx={{ display: { md: 'none', xs: 'block' } }}
        variant="temporary"
      >
        <StudentNavigationContent collapsed={false} onNavigate={() => setMobileOpen(false)} />
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          px: { lg: 4, md: 3, xs: 2 },
          py: { md: 3, xs: 2 },
          pt: { md: 3, xs: 10 },
        }}
      >
        <Paper
          sx={{
            border: '1px solid rgba(148,163,184,0.18)',
            borderRadius: 3,
            display: { md: 'block', xs: 'none' },
            mb: 3,
            p: 2,
          }}
          variant="outlined"
        >
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography sx={{ fontSize: 22, fontWeight: 900 }}>{t('Hoş geldin')}, {displayName}</Typography>
              <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                {t('Bugünkü çalışma, test ve tekrar akışına buradan devam edebilirsin.')}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
              <Button
                component={NavLink}
                startIcon={<SearchRoundedIcon />}
                sx={{ borderRadius: 2 }}
                to="/quizzes"
                variant="outlined"
              >
                {t('Deneme Keşfet')}
              </Button>
              <Avatar
                sx={{
                  background: 'linear-gradient(135deg, #14b8a6 0%, #2563eb 100%)',
                  fontSize: 14,
                  fontWeight: 900,
                  height: 38,
                  width: 38,
                }}
              >
                {userInitial}
              </Avatar>
              <Divider flexItem orientation="vertical" />
              <Button color="inherit" onClick={handleLogout} size="small" startIcon={<LogoutOutlinedIcon />} variant="outlined">
                {t('Çıkış')}
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Box sx={{ maxWidth: 1320 }}>
          <AppBreadcrumbs area="student" />
          <Outlet context={appContext} />
        </Box>
      </Box>

      <ResumeQuizModal />
      <AchievementCelebrationLayer />
    </Box>
  )
}
