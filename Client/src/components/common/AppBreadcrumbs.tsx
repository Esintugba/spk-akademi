import NavigateNextRoundedIcon from '@mui/icons-material/NavigateNextRounded'
import { Breadcrumbs, Link as MuiLink, Paper, Typography } from '@mui/material'
import { Link as RouterLink, useLocation } from 'react-router'
import { resolveRouteTitle } from '../../shared/config/branding'
import { useLocalization } from '../../shared/localization'

type BreadcrumbArea = 'admin' | 'student'

interface BreadcrumbItem {
  label: string
  path?: string
}

interface AppBreadcrumbsProps {
  area: BreadcrumbArea
}

const studentDynamicParents: Array<{ match: (pathname: string) => boolean; parent: BreadcrumbItem[]; title: string }> = [
  { match: (pathname) => pathname.startsWith('/study/'), parent: [{ label: 'Derslerim', path: '/my-courses' }], title: 'Konu Çalışması' },
  { match: (pathname) => pathname.startsWith('/materials/viewer/'), parent: [{ label: 'Kaynaklarım', path: '/my-materials' }], title: 'Materyal Görüntüleyici' },
  { match: (pathname) => pathname.startsWith('/licenses/') && pathname.endsWith('/quizzes'), parent: [{ label: 'Deneme Kataloğu', path: '/quizzes' }], title: 'Lisans Denemeleri' },
  { match: (pathname) => pathname.startsWith('/quizzes/'), parent: [{ label: 'Deneme Kataloğu', path: '/quizzes' }], title: 'Deneme Detayı' },
  { match: (pathname) => pathname.startsWith('/quiz/results/'), parent: [{ label: 'Sonuçlarım', path: '/trials' }], title: 'Quiz Sonucu' },
  { match: (pathname) => pathname.startsWith('/quiz/course-practice/'), parent: [{ label: 'Ders Bazlı Test', path: '/quiz/course-practice' }], title: 'Test Oturumu' },
  { match: (pathname) => pathname.startsWith('/quiz/wrong-answers/'), parent: [{ label: 'Yanlışlarım', path: '/quiz/wrong-answers' }], title: 'Tekrar Testi' },
  { match: (pathname) => pathname.startsWith('/quiz/topic/'), parent: [{ label: 'Alt Konu Testi', path: '/quiz' }], title: 'Konu Pratiği' },
  { match: (pathname) => pathname.startsWith('/quiz/mixed/'), parent: [{ label: 'Karışık Test', path: '/mixed-practice' }], title: 'Karma Pratik' },
  { match: (pathname) => pathname.startsWith('/quiz/session/') || pathname.startsWith('/quiz/free/') || pathname.startsWith('/quiz/licensed/') || pathname.startsWith('/quiz/mock/'), parent: [{ label: 'Deneme Kataloğu', path: '/quizzes' }], title: 'Deneme Oturumu' },
  { match: (pathname) => pathname.startsWith('/reviews/session/'), parent: [{ label: 'Bugünkü Tekrarlar', path: '/reviews/today' }], title: 'Tekrar Oturumu' },
  { match: (pathname) => pathname.startsWith('/my-trials/session/'), parent: [{ label: 'Denemelerim', path: '/my-trials' }], title: 'Deneme Oturumu' },
  { match: (pathname) => pathname.startsWith('/trials/'), parent: [{ label: 'Sonuçlarım', path: '/trials' }], title: 'Deneme Detayı' },
  { match: (pathname) => pathname.startsWith('/support/new'), parent: [{ label: 'Destek Taleplerim', path: '/support/my-tickets' }], title: 'Yeni Destek Talebi' },
  { match: (pathname) => pathname.startsWith('/support/tickets/'), parent: [{ label: 'Destek Taleplerim', path: '/support/my-tickets' }], title: 'Destek Talebi Detayı' },
  { match: (pathname) => pathname.startsWith('/profile/achievements'), parent: [{ label: 'Profil', path: '/profile' }], title: 'Başarımlar' },
]

function buildBreadcrumbItems(area: BreadcrumbArea, pathname: string): BreadcrumbItem[] {
  const root: BreadcrumbItem = area === 'admin'
    ? { label: 'Admin Paneli', path: '/admin' }
    : { label: 'Öğrenci Paneli', path: '/dashboard' }

  if (area === 'student') {
    const dynamicMatch = studentDynamicParents.find((item) => item.match(pathname))

    if (dynamicMatch) {
      return [root, ...dynamicMatch.parent, { label: dynamicMatch.title }]
    }
  }

  return [root, { label: resolveRouteTitle(pathname) ?? 'Sayfa' }]
}

export function AppBreadcrumbs({ area }: AppBreadcrumbsProps) {
  const { pathname } = useLocation()
  const items = buildBreadcrumbItems(area, pathname)
  const { t } = useLocalization()

  return (
    <Paper
      sx={{
        borderColor: 'rgba(148,163,184,0.22)',
        borderRadius: 2,
        mb: 2,
        px: 1.5,
        py: 1,
      }}
      variant="outlined"
    >
      <Breadcrumbs
        aria-label={t('Sayfa yolu')}
        separator={<NavigateNextRoundedIcon fontSize="small" />}
        sx={{
          '& .MuiBreadcrumbs-separator': { mx: 0.75 },
          color: 'text.secondary',
          fontSize: 13,
        }}
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          const isDuplicateCurrentPath = item.path === pathname

          if (isLast || isDuplicateCurrentPath || !item.path) {
            return (
              <Typography key={`${item.label}-${index}`} color={isLast ? 'text.primary' : 'text.secondary'} sx={{ fontSize: 13, fontWeight: isLast ? 800 : 700 }}>
                {t(item.label)}
              </Typography>
            )
          }

          return (
            <MuiLink
              key={`${item.label}-${index}`}
              color="text.secondary"
              component={RouterLink}
              sx={{ fontSize: 13, fontWeight: 700, textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
              to={item.path}
            >
              {t(item.label)}
            </MuiLink>
          )
        })}
      </Breadcrumbs>
    </Paper>
  )
}
