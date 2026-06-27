import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Box, Button, Chip, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { BlogPostStatus, type BlogPostListItem, type UpsertBlogPost } from '../../models'
import { api } from '../../shared/api'
import { AdminPageHero } from '../common/AdminPageHero'
import { EmptyState } from '../common/EmptyState'

const emptyForm: UpsertBlogPost = {
  title: '',
  slug: '',
  summary: '',
  content: '',
  coverImageUrl: '',
  categoryId: '',
  status: BlogPostStatus.Draft,
  publishedAt: new Date().toISOString(),
  metaTitle: '',
  metaDescription: '',
  canonicalUrl: '',
  tags: [],
}

export function AdminBlogPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<UpsertBlogPost>(emptyForm)
  const [editing, setEditing] = useState<BlogPostListItem | null>(null)
  const [tagInput, setTagInput] = useState('')

  const postsQuery = useQuery({
    queryKey: ['admin', 'blog'],
    queryFn: () => api.getAdminBlogPosts({ page: 1, pageSize: 48 }),
  })

  const categoriesQuery = useQuery({
    queryKey: ['blog', 'categories'],
    queryFn: api.getBlogCategories,
  })

  const saveMutation = useMutation({
    mutationFn: (payload: UpsertBlogPost) =>
      editing ? api.updateBlogPost(editing.id, payload) : api.createBlogPost(payload),
    onSuccess: async () => {
      toast.success('Blog yazısı kaydedildi.')
      setForm(emptyForm)
      setEditing(null)
      await queryClient.invalidateQueries({ queryKey: ['admin', 'blog'] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const deleteMutation = useMutation({
    mutationFn: api.deleteBlogPost,
    onSuccess: async () => {
      toast.success('Blog yazısı silindi.')
      await queryClient.invalidateQueries({ queryKey: ['admin', 'blog'] })
    },
  })

  const tags = useMemo(
    () => tagInput.split(',').map((tag) => tag.trim()).filter(Boolean),
    [tagInput],
  )

  async function editPost(post: BlogPostListItem) {
    const detail = await api.getAdminBlogPost(post.id)
    setEditing(post)
    setForm({
      title: detail.title,
      slug: detail.slug,
      summary: detail.summary,
      content: detail.content,
      coverImageUrl: detail.coverImageUrl ?? '',
      categoryId: detail.category?.id ?? '',
      status: detail.status,
      publishedAt: detail.publishedAt ?? new Date().toISOString(),
      metaTitle: detail.metaTitle,
      metaDescription: detail.metaDescription,
      canonicalUrl: detail.canonicalUrl,
      tags: detail.tags.map((tag) => tag.name),
    })
    setTagInput(detail.tags.map((tag) => tag.name).join(', '))
  }

  function save() {
    saveMutation.mutate({
      ...form,
      categoryId: form.categoryId || null,
      tags,
      publishedAt: form.status === BlogPostStatus.Published ? form.publishedAt || new Date().toISOString() : form.publishedAt,
    })
  }

  return (
    <Stack spacing={3}>
      <AdminPageHero
        title="Blog ve rehber içeriklerini yönet."
        description="SEO odaklı makaleler, kategori/etiket yapısı, meta alanları ve yayın durumunu bu panelden kontrol edin."
        actions={<Button startIcon={<AddRoundedIcon />} variant="contained" onClick={() => { setEditing(null); setForm(emptyForm); setTagInput('') }}>Yeni yazı</Button>}
      />

      <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { lg: '0.95fr 1.05fr', xs: '1fr' } }}>
        <Paper sx={{ borderRadius: 3, p: 2.5 }} variant="outlined">
          <Stack spacing={2}>
            <Typography sx={{ fontWeight: 900 }}>{editing ? 'Yazıyı düzenle' : 'Yeni yazı oluştur'}</Typography>
            <TextField label="Başlık" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
            <TextField label="Slug" value={form.slug ?? ''} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} />
            <TextField label="Özet" multiline rows={3} value={form.summary} onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))} />
            <TextField label="İçerik HTML" multiline rows={9} value={form.content} onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))} />
            <TextField label="Kapak görsel URL" value={form.coverImageUrl ?? ''} onChange={(event) => setForm((current) => ({ ...current, coverImageUrl: event.target.value }))} />
            <TextField label="Kategori" select value={form.categoryId ?? ''} onChange={(event) => setForm((current) => ({ ...current, categoryId: event.target.value }))}>
              <MenuItem value="">Kategori yok</MenuItem>
              {(categoriesQuery.data ?? []).map((category) => (
                <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>
              ))}
            </TextField>
            <TextField label="Durum" select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: Number(event.target.value) }))}>
              <MenuItem value={BlogPostStatus.Draft}>Taslak</MenuItem>
              <MenuItem value={BlogPostStatus.Published}>Yayında</MenuItem>
              <MenuItem value={BlogPostStatus.Archived}>Arşiv</MenuItem>
            </TextField>
            <TextField label="Meta title" value={form.metaTitle ?? ''} onChange={(event) => setForm((current) => ({ ...current, metaTitle: event.target.value }))} />
            <TextField label="Meta description" value={form.metaDescription ?? ''} onChange={(event) => setForm((current) => ({ ...current, metaDescription: event.target.value }))} />
            <TextField label="Etiketler" helperText="Virgülle ayırın" value={tagInput} onChange={(event) => setTagInput(event.target.value)} />
            <Button disabled={saveMutation.isPending} onClick={save} variant="contained">
              {saveMutation.isPending ? 'Kaydediliyor' : 'Kaydet'}
            </Button>
          </Stack>
        </Paper>

        <Paper sx={{ borderRadius: 3, p: 2.5 }} variant="outlined">
          <Stack spacing={2}>
            <Typography sx={{ fontWeight: 900 }}>Yazılar</Typography>
            {postsQuery.data?.items.length === 0 && <EmptyState title="Yazı yok" description="İlk rehber içeriğini oluştur." />}
            {(postsQuery.data?.items ?? []).map((post) => (
              <Paper key={post.id} sx={{ borderRadius: 2.5, p: 2 }} variant="outlined">
                <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1.5} sx={{ justifyContent: 'space-between' }}>
                  <Box>
                    <Typography sx={{ fontWeight: 900 }}>{post.title}</Typography>
                    <Typography color="text.secondary" variant="body2">{post.slug}</Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Chip label={post.status === BlogPostStatus.Published ? 'Yayında' : post.status === BlogPostStatus.Draft ? 'Taslak' : 'Arşiv'} size="small" />
                      <Chip label={`${post.readingTime} dk`} size="small" variant="outlined" />
                    </Stack>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <Button startIcon={<EditOutlinedIcon />} onClick={() => void editPost(post)}>Düzenle</Button>
                    <Button color="error" startIcon={<DeleteOutlineOutlinedIcon />} onClick={() => deleteMutation.mutate(post.id)}>Sil</Button>
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Paper>
      </Box>
    </Stack>
  )
}
