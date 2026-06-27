import AnalyticsOutlinedIcon from '@mui/icons-material/AnalyticsOutlined'
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined'
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined'
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined'
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined'
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined'
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined'
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined'
import LeaderboardOutlinedIcon from '@mui/icons-material/LeaderboardOutlined'
import LibraryBooksOutlinedIcon from '@mui/icons-material/LibraryBooksOutlined'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import NoteAltOutlinedIcon from '@mui/icons-material/NoteAltOutlined'
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined'
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined'
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined'
import ReplayOutlinedIcon from '@mui/icons-material/ReplayOutlined'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import ShuffleOutlinedIcon from '@mui/icons-material/ShuffleOutlined'
import StarsOutlinedIcon from '@mui/icons-material/StarsOutlined'
import TrendingDownOutlinedIcon from '@mui/icons-material/TrendingDownOutlined'
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined'
import type { ReactElement } from 'react'

export type StudentNavItem = {
  id: string
  label: string
  path: string
  icon: ReactElement
  badgeLabel?: string
  disabled?: boolean
  exactMatchPaths?: string[]
  matchPaths?: string[]
}

export type StudentNavSection = {
  id: string
  label?: string
  items: StudentNavItem[]
}

export const studentNavigation: StudentNavSection[] = [
  {
    id: 'dashboard',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/dashboard',
        icon: <HomeOutlinedIcon />,
      },
    ],
  },
  {
    id: 'study-center',
    label: 'Çalışma Merkezi',
    items: [
      {
        id: 'my-courses',
        label: 'Derslerim',
        path: '/my-courses',
        icon: <SchoolOutlinedIcon />,
        matchPaths: ['/my-courses', '/study/'],
      },
      {
        id: 'topics',
        label: 'Konularım',
        path: '/my-topics',
        icon: <LibraryBooksOutlinedIcon />,
        matchPaths: ['/my-topics'],
      },
      {
        id: 'materials',
        label: 'Kaynaklarım',
        path: '/my-materials',
        icon: <PictureAsPdfOutlinedIcon />,
        matchPaths: ['/my-materials', '/materials/viewer'],
      },
      {
        id: 'notes',
        label: 'Notlarım',
        path: '/my-notes',
        icon: <NoteAltOutlinedIcon />,
        matchPaths: ['/my-notes'],
      },
    ],
  },
  {
    id: 'test-center',
    label: 'Test Merkezi',
    items: [
      {
        id: 'quiz-catalog',
        label: 'Deneme Kataloğu',
        path: '/quizzes',
        icon: <AutoStoriesOutlinedIcon />,
        matchPaths: ['/quizzes', '/licenses/'],
      },
      {
        id: 'my-trials',
        label: 'Denemelerim',
        path: '/my-trials',
        icon: <AssignmentTurnedInOutlinedIcon />,
        matchPaths: ['/my-trials'],
      },
      {
        id: 'course-practice',
        label: 'Ders Bazlı Test',
        path: '/quiz/course-practice',
        icon: <MenuBookOutlinedIcon />,
        matchPaths: ['/quiz/course-practice'],
      },
      {
        id: 'topic-practice',
        label: 'Alt Konu Testi',
        path: '/quiz',
        icon: <QuizOutlinedIcon />,
        exactMatchPaths: ['/quiz'],
        matchPaths: ['/quiz/topic', '/quiz/session'],
      },
      {
        id: 'mixed-practice',
        label: 'Karışık Test',
        path: '/mixed-practice',
        icon: <ShuffleOutlinedIcon />,
        exactMatchPaths: ['/mixed-practice'],
        matchPaths: ['/quiz/mixed'],
      },
      {
        id: 'past-exams',
        label: 'Çıkmış Sorular',
        path: '/questions/past-exams',
        icon: <FactCheckOutlinedIcon />,
      },
      {
        id: 'wrong-answers',
        label: 'Yanlışlarım',
        path: '/quiz/wrong-answers',
        icon: <TrendingDownOutlinedIcon />,
        matchPaths: ['/quiz/wrong-answers'],
      },
    ],
  },
  {
    id: 'review-center',
    label: 'Tekrar Merkezi',
    items: [
      {
        id: 'today-reviews',
        label: 'Bugünkü Tekrarlar',
        path: '/reviews/today',
        icon: <ReplayOutlinedIcon />,
        matchPaths: ['/reviews'],
      },
    ],
  },
  {
    id: 'performance',
    label: 'Performans',
    items: [
      {
        id: 'results',
        label: 'Sonuçlarım',
        path: '/trials',
        icon: <FlagOutlinedIcon />,
        matchPaths: ['/trials', '/quiz/results'],
      },
      {
        id: 'analytics',
        label: 'Analitikler',
        path: '/reports',
        icon: <AnalyticsOutlinedIcon />,
      },
      {
        id: 'goals',
        label: 'Hedeflerim',
        path: '/goals',
        icon: <StarsOutlinedIcon />,
      },
    ],
  },
  {
    id: 'achievements',
    label: 'Başarı ve Oyunlaştırma',
    items: [
      {
        id: 'badges',
        label: 'Rozetler',
        path: '/gamification',
        icon: <WorkspacePremiumOutlinedIcon />,
      },
      {
        id: 'achievements',
        label: 'Başarımlar',
        path: '/profile/achievements',
        icon: <EmojiEventsOutlinedIcon />,
      },
      {
        id: 'leaderboard',
        label: 'Liderlik Tablosu',
        path: '/leaderboard',
        icon: <LeaderboardOutlinedIcon />,
      },
    ],
  },
  {
    id: 'account',
    label: 'Hesap',
    items: [
      {
        id: 'profile',
        label: 'Profil',
        path: '/profile',
        icon: <PersonOutlineOutlinedIcon />,
      },
      {
        id: 'accesses',
        label: 'Erişimlerim',
        path: '/dashboard/access-requests',
        icon: <WorkspacePremiumOutlinedIcon />,
      },
      {
        id: 'support',
        label: 'Destek Taleplerim',
        path: '/support/my-tickets',
        icon: <HelpOutlineOutlinedIcon />,
        matchPaths: ['/support/my-tickets', '/support/new', '/support/tickets'],
      },
      {
        id: 'settings',
        label: 'Ayarlar',
        path: '/settings',
        icon: <SettingsOutlinedIcon />,
      },
    ],
  },
]
