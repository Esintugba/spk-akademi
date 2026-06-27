import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import LibraryBooksOutlinedIcon from '@mui/icons-material/LibraryBooksOutlined'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import TopicOutlinedIcon from '@mui/icons-material/TopicOutlined'
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined'
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined'
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined'
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined'
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined'
import RuleOutlinedIcon from '@mui/icons-material/RuleOutlined'
import MarkEmailUnreadOutlinedIcon from '@mui/icons-material/MarkEmailUnreadOutlined'
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined'
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import PrivacyTipOutlinedIcon from '@mui/icons-material/PrivacyTipOutlined'
import MilitaryTechOutlinedIcon from '@mui/icons-material/MilitaryTechOutlined'
import { Chip, List, ListItemButton, ListItemIcon, ListItemText, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { NavLink } from 'react-router'
import { selectIsAdmin } from '../../app/authSlice'
import { useAppSelector } from '../../app/hooks'
import { navigationItems, type PageKey } from '../../shared/navigation'

const icons: Record<PageKey, ReactNode> = {
  dashboard: <DashboardOutlinedIcon />,
  licenses: <SchoolOutlinedIcon />,
  courses: <LibraryBooksOutlinedIcon />,
  topics: <TopicOutlinedIcon />,
  notes: <MenuBookOutlinedIcon />,
  questions: <QuizOutlinedIcon />,
  sourceDocuments: <PictureAsPdfOutlinedIcon />,
  quiz: <AutoStoriesOutlinedIcon />,
  trialExams: <FactCheckOutlinedIcon />,
  moderation: <RuleOutlinedIcon />,
  access: <AdminPanelSettingsOutlinedIcon />,
  accessRequests: <FactCheckOutlinedIcon />,
  contactMessages: <MarkEmailUnreadOutlinedIcon />,
  supportTickets: <SupportAgentOutlinedIcon />,
  blog: <ArticleOutlinedIcon />,
  import: <UploadFileOutlinedIcon />,
  consents: <PrivacyTipOutlinedIcon />,
  badges: <MilitaryTechOutlinedIcon />,
  login: <LoginOutlinedIcon />,
  register: <PersonAddAltOutlinedIcon />,
}

export function NavLinks() {
  const isAdmin = useAppSelector(selectIsAdmin)
  const hiddenKeys: PageKey[] = ['login', 'register', 'quiz']
  const appNavigationItems = navigationItems.filter((item) => {
    if (hiddenKeys.includes(item.key)) {
      return false
    }

    return isAdmin
  })

  return (
    <Stack spacing={2} sx={{ px: 2, py: 1 }}>
      <Stack spacing={0.75} sx={{ px: 1 }}>
        <Typography sx={{ color: '#f8fafc', fontSize: 13, fontWeight: 800 }}>
          İçerik Yönetimi
        </Typography>
        <Typography sx={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.6 }}>
          Ders notları, soru bankası, erişimler ve deneme akışını tek merkezden yönetin.
        </Typography>
      </Stack>

      <List sx={{ p: 0 }}>
        {appNavigationItems.map((item) => (
          <ListItemButton
            component={NavLink}
            end={item.path === '/'}
            key={item.key}
            to={item.path}
            sx={{
              borderRadius: 3,
              color: '#dbe4f0',
              mb: 0.75,
              px: 1.5,
              py: 1.2,
              textDecoration: 'none',
              '& .MuiListItemText-primary': {
                fontWeight: 700,
              },
              '&.active': {
                bgcolor: 'rgba(59,130,246,0.18)',
                color: '#ffffff',
              },
              '&.active:hover, &:hover': {
                bgcolor: 'rgba(51,65,85,0.95)',
                color: '#ffffff',
              },
            }}
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>{icons[item.key]}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>

      <Chip
        label="Yalnızca Admin erişimi"
        size="small"
        sx={{
          alignSelf: 'flex-start',
          bgcolor: 'rgba(148,163,184,0.14)',
          color: '#cbd5e1',
          fontWeight: 700,
        }}
      />
    </Stack>
  )
}
