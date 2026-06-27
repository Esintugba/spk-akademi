import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import { useQuery } from '@tanstack/react-query'
import { Alert, Box, Button, Container, Paper, Skeleton, Stack, Typography } from '@mui/material'
import { Link as RouterLink, useParams } from 'react-router'
import { api } from '../../shared/api'
import { SeoHead } from '../../seo/SeoHead'
import { breadcrumbSchema, courseSchema } from '../../seo/seoUtils'
import { MarketingHero } from '../common/MarketingHero'

interface PublicSeoDetailPageProps {
  type: 'course' | 'topic'
}

export function PublicSeoDetailPage({ type }: PublicSeoDetailPageProps) {
  const { slug } = useParams()
  const seoQuery = useQuery({
    enabled: Boolean(slug),
    queryKey: ['public-seo', slug],
    queryFn: () => api.getPublicSeo(slug!),
    staleTime: 300_000,
  })

  if (seoQuery.isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Skeleton height={260} variant="rounded" />
      </Container>
    )
  }

  if (!seoQuery.data) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Alert severity="error">İçerik bulunamadı.</Alert>
      </Container>
    )
  }

  const seo = seoQuery.data
  const path = type === 'course' ? `/courses/${seo.slug}` : `/topics/${seo.slug}`
  const schema = [
    courseSchema({
      name: seo.title,
      description: seo.description,
      path,
    }),
    breadcrumbSchema([
      { name: 'Ana Sayfa', path: '/' },
      { name: type === 'course' ? 'Dersler' : 'Konular', path: '/plans' },
      { name: seo.title, path },
    ]),
  ]

  return (
    <Box sx={{ pb: 6 }}>
      <SeoHead
        canonical={seo.canonicalUrl}
        description={seo.description}
        image={seo.imageUrl}
        ogType={seo.openGraphType}
        schema={schema}
        title={seo.title}
      />
      <MarketingHero
        eyebrow={type === 'course' ? 'Ders' : 'Konu'}
        title={seo.title}
        description={seo.description}
      />
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper sx={{ borderRadius: 3, p: { md: 4, xs: 3 } }} variant="outlined">
          <Stack spacing={2}>
            <ArticleOutlinedIcon color="primary" />
            <Typography sx={{ fontWeight: 900 }} variant="h5">
              Güncel müfredat kapsamı
            </Typography>
            <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>
              Bu sayfa arama motorları ve ziyaretçiler için yayınlanan içerik özetidir. Detaylı çalışma deneyimi için platforma giriş yaparak lisans kapsamındaki derslere erişebilirsin.
            </Typography>
            <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1.5}>
              <Button component={RouterLink} to="/plans" variant="contained">
                Lisansları İncele
              </Button>
              <Button component={RouterLink} to="/register" variant="outlined">
                Kayıt Ol
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </Box>
  )
}
