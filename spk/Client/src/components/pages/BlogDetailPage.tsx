import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined'
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { useQuery } from '@tanstack/react-query'
import { Alert, Box, Button, Chip, Container, Paper, Skeleton, Stack, Typography } from '@mui/material'
import { Link as RouterLink, useParams } from 'react-router'
import { api } from '../../shared/api'
import { SeoHead } from '../../seo/SeoHead'
import { absoluteUrl, articleSchema, breadcrumbSchema } from '../../seo/seoUtils'
import { sanitizeBlogHtml } from '../../utils/htmlSanitizer'

export function BlogDetailPage() {
  const { slug = '' } = useParams()
  const postQuery = useQuery({
    queryKey: ['blog', 'post', slug],
    queryFn: () => api.getBlogPost(slug),
    enabled: Boolean(slug),
    staleTime: 120_000,
  })

  if (postQuery.isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Skeleton height={420} variant="rounded" />
      </Container>
    )
  }

  if (postQuery.error instanceof Error) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Alert severity="error">{postQuery.error.message}</Alert>
      </Container>
    )
  }

  const post = postQuery.data
  if (!post) {
    return null
  }

  const path = `/blog/${post.slug}`
  const canonical = absoluteUrl(post.canonicalUrl || path)
  const safeContent = sanitizeBlogHtml(post.content)
  const structuredData = [
    articleSchema({
      title: post.title,
      description: post.metaDescription,
      path,
      image: post.coverImageUrl,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
      authorName: post.authorName,
    }),
    breadcrumbSchema([
      { name: 'Ana Sayfa', path: '/' },
      { name: 'Blog', path: '/blog' },
      { name: post.title, path },
    ]),
  ]

  return (
    <Box sx={{ pb: { md: 8, xs: 5 } }}>
      <SeoHead
        canonical={canonical}
        description={post.metaDescription}
        image={post.coverImageUrl}
        ogType="article"
        schema={structuredData}
        title={post.metaTitle}
      />

      <Container maxWidth="lg" sx={{ pt: { md: 7, xs: 4 } }}>
        <Stack spacing={3}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
              {post.category && <Chip color="primary" label={post.category.name} />}
              <Chip icon={<AccessTimeOutlinedIcon />} label={`${post.readingTime} dk okuma`} variant="outlined" />
              <Chip icon={<VisibilityOutlinedIcon />} label={`${post.viewCount} görüntülenme`} variant="outlined" />
            </Stack>
            <Typography component="h1" sx={{ fontSize: { md: 54, xs: 34 }, fontWeight: 900, letterSpacing: 0, lineHeight: 1.08 }}>
              {post.title}
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: 18, lineHeight: 1.8 }}>
              {post.summary}
            </Typography>
          </Stack>

          {post.coverImageUrl && (
            <Box
              sx={{
                aspectRatio: '16 / 7',
                backgroundImage: `url(${post.coverImageUrl})`,
                backgroundPosition: 'center',
                backgroundSize: 'cover',
                borderRadius: 3,
              }}
            />
          )}

          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { md: '1fr 280px', xs: '1fr' } }}>
            <Paper sx={{ borderRadius: 3, p: { md: 4, xs: 2.5 } }} variant="outlined">
              <Box
                sx={{
                  '& h2': { fontSize: 30, fontWeight: 900, mt: 4 },
                  '& h3': { fontSize: 24, fontWeight: 850, mt: 3 },
                  '& p': { lineHeight: 1.9 },
                  '& img': { borderRadius: 2, maxWidth: '100%' },
                  '& table': { borderCollapse: 'collapse', width: '100%' },
                  '& td, & th': { border: '1px solid rgba(148,163,184,0.24)', p: 1 },
                }}
                dangerouslySetInnerHTML={{ __html: safeContent }}
              />
            </Paper>

            <Stack spacing={2}>
              <Paper sx={{ borderRadius: 3, p: 2.5 }} variant="outlined">
                <Typography sx={{ fontWeight: 900 }}>Paylaş</Typography>
                <Button
                  fullWidth
                  startIcon={<ShareOutlinedIcon />}
                  sx={{ mt: 1.5 }}
                  variant="outlined"
                  onClick={() => void navigator.clipboard?.writeText(canonical)}
                >
                  Linki Kopyala
                </Button>
              </Paper>

              <Paper sx={{ borderRadius: 3, p: 2.5 }} variant="outlined">
                <Typography sx={{ fontWeight: 900, mb: 1.5 }}>İlgili Yazılar</Typography>
                <Stack spacing={1.5}>
                  {post.relatedPosts.map((related) => (
                    <Typography component={RouterLink} key={related.id} sx={{ color: 'text.primary', fontWeight: 700, textDecoration: 'none' }} to={`/blog/${related.slug}`}>
                      {related.title}
                    </Typography>
                  ))}
                </Stack>
              </Paper>
            </Stack>
          </Box>
        </Stack>
      </Container>
    </Box>
  )
}
