import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { useQuery } from '@tanstack/react-query'
import { Alert, Box, Button, Chip, Container, InputAdornment, Paper, Skeleton, Stack, TextField, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import { Link as RouterLink, useParams } from 'react-router'
import { api } from '../../shared/api'
import { SeoHead } from '../../seo/SeoHead'
import { absoluteUrl, breadcrumbSchema } from '../../seo/seoUtils'
import { MarketingHero } from '../common/MarketingHero'
import { MarketingSectionHeading } from '../common/MarketingSectionHeading'

function formatDate(value?: string | null) {
  return value
    ? new Date(value).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'Taslak'
}

export function BlogPage() {
  const { slug: categorySlug } = useParams()
  const [search, setSearch] = useState('')
  const [submittedSearch, setSubmittedSearch] = useState('')

  const postsQuery = useQuery({
    queryKey: ['blog', 'posts', categorySlug, submittedSearch],
    queryFn: () => api.getBlogPosts({ categorySlug, search: submittedSearch || undefined, page: 1, pageSize: 18 }),
    staleTime: 120_000,
  })

  const categoriesQuery = useQuery({
    queryKey: ['blog', 'categories'],
    queryFn: api.getBlogCategories,
    staleTime: 300_000,
  })

  const popularPosts = useMemo(
    () => [...(postsQuery.data?.items ?? [])].sort((left, right) => right.viewCount - left.viewCount).slice(0, 5),
    [postsQuery.data?.items],
  )
  const activeCategory = categoriesQuery.data?.find((category) => category.slug === categorySlug)
  const canonical = categorySlug ? `/blog/category/${categorySlug}` : '/blog'
  const title = activeCategory ? `${activeCategory.name} Rehberleri` : 'Blog ve Rehberler'
  const description = activeCategory?.description || 'SPK lisansları, çıkmış sorular ve sınav hazırlık rehberleri.'
  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: title,
      description,
      url: absoluteUrl(canonical),
      blogPost: (postsQuery.data?.items ?? []).slice(0, 10).map((post) => ({
        '@type': 'BlogPosting',
        headline: post.title,
        url: absoluteUrl(`/blog/${post.slug}`),
        datePublished: post.publishedAt,
      })),
    },
    breadcrumbSchema([
      { name: 'Ana Sayfa', path: '/' },
      { name: 'Blog', path: '/blog' },
      ...(activeCategory ? [{ name: activeCategory.name, path: canonical }] : []),
    ]),
  ]

  return (
    <Box sx={{ pb: { md: 8, xs: 5 } }}>
      <SeoHead canonical={canonical} description={description} schema={schema} title={title} />
      <MarketingHero
        eyebrow="Blog ve Rehberler"
        title="SPK sınavları için rehber içerikler"
        description="Lisans türleri, çıkmış sorular, çalışma programı ve sınav stratejileri için SEO odaklı güncel içerikler."
      />

      <Container maxWidth="xl" sx={{ mt: { md: 7, xs: 4 } }}>
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { lg: '1fr 320px', xs: '1fr' } }}>
          <Stack spacing={3}>
            <Paper
              component="form"
              onSubmit={(event) => {
                event.preventDefault()
                setSubmittedSearch(search.trim())
              }}
              sx={{ borderRadius: 3, p: 2 }}
              variant="outlined"
            >
              <TextField
                fullWidth
                placeholder="SPK Düzey 1, çıkmış sorular, çalışma programı..."
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchOutlinedIcon />
                      </InputAdornment>
                    ),
                  },
                }}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </Paper>

            {postsQuery.isLoading ? (
              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { md: 'repeat(2, 1fr)', xs: '1fr' } }}>
                {[1, 2, 3, 4].map((item) => <Skeleton key={item} height={280} variant="rounded" />)}
              </Box>
            ) : postsQuery.error instanceof Error ? (
              <Alert severity="error">{postsQuery.error.message}</Alert>
            ) : (
              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { md: 'repeat(2, minmax(0, 1fr))', xs: '1fr' } }}>
                {(postsQuery.data?.items ?? []).map((post) => (
                  <Paper key={post.id} sx={{ borderRadius: 3, display: 'flex', flexDirection: 'column', overflow: 'hidden' }} variant="outlined">
                    <Box
                      sx={{
                        aspectRatio: '16 / 8',
                        bgcolor: 'rgba(15,118,110,0.08)',
                        backgroundImage: post.coverImageUrl ? `url(${post.coverImageUrl})` : undefined,
                        backgroundPosition: 'center',
                        backgroundSize: 'cover',
                      }}
                    />
                    <Stack spacing={1.5} sx={{ flex: 1, p: 2.5 }}>
                      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                        {post.category && <Chip color="primary" label={post.category.name} size="small" />}
                        <Chip icon={<AccessTimeOutlinedIcon />} label={`${post.readingTime} dk`} size="small" variant="outlined" />
                      </Stack>
                      <Typography component={RouterLink} sx={{ color: 'text.primary', fontSize: 22, fontWeight: 900, textDecoration: 'none' }} to={`/blog/${post.slug}`}>
                        {post.title}
                      </Typography>
                      <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                        {post.summary}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 'auto' }}>
                        <Typography color="text.secondary" variant="body2">{formatDate(post.publishedAt)}</Typography>
                        <VisibilityOutlinedIcon sx={{ color: 'text.secondary', fontSize: 16 }} />
                        <Typography color="text.secondary" variant="body2">{post.viewCount}</Typography>
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
              </Box>
            )}
          </Stack>

          <Stack spacing={2}>
            <MarketingSectionHeading eyebrow="Keşfet" title="Kategoriler" description="Sınav hazırlık yolculuğuna göre filtrele." />
            <Paper sx={{ borderRadius: 3, p: 2 }} variant="outlined">
              <Stack spacing={1}>
                <Button component={RouterLink} to="/blog" variant={!categorySlug ? 'contained' : 'text'}>Tüm Yazılar</Button>
                {(categoriesQuery.data ?? []).map((category) => (
                  <Button component={RouterLink} key={category.id} to={`/blog/category/${category.slug}`} variant={categorySlug === category.slug ? 'contained' : 'text'}>
                    {category.name} ({category.postCount})
                  </Button>
                ))}
              </Stack>
            </Paper>

            <Paper sx={{ borderRadius: 3, p: 2.5 }} variant="outlined">
              <Typography sx={{ fontWeight: 900, mb: 1.5 }}>Popüler Yazılar</Typography>
              <Stack spacing={1.5}>
                {popularPosts.map((post) => (
                  <Typography component={RouterLink} key={post.id} sx={{ color: 'text.primary', fontWeight: 700, textDecoration: 'none' }} to={`/blog/${post.slug}`}>
                    {post.title}
                  </Typography>
                ))}
              </Stack>
            </Paper>
          </Stack>
        </Box>
      </Container>
    </Box>
  )
}
