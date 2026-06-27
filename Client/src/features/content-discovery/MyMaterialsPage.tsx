import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined'
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import {
  Alert,
  Box,
  Button,
  Chip,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { Link as RouterLink, useSearchParams } from 'react-router'
import { EmptyState } from '../../components/common/EmptyState'
import { StudentPageHero } from '../../components/common/StudentPageHero'
import { useMyMaterials } from './hooks/useStudentContentDiscovery'

export function MyMaterialsPage() {
  const [searchParams] = useSearchParams()
  const materialsQuery = useMyMaterials()
  const materials = useMemo(() => materialsQuery.data ?? [], [materialsQuery.data])
  const [search, setSearch] = useState('')
  const [courseId, setCourseId] = useState(() => searchParams.get('courseId') ?? '')

  const courseOptions = useMemo(
    () => Array.from(
      new Map(materials.map((material) => [material.courseId, material.courseName])),
      ([id, name]) => ({ id, name }),
    ).sort((left, right) => left.name.localeCompare(right.name, 'tr')),
    [materials],
  )

  const filteredMaterials = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return materials
      .filter((material) => !courseId || material.courseId === courseId)
      .filter((material) => {
        if (!normalizedSearch) return true
        return `${material.title} ${material.sourceName} ${material.courseName}`.toLowerCase().includes(normalizedSearch)
      })
      .sort((left, right) => {
        const leftTime = left.lastOpenedAt ? new Date(left.lastOpenedAt).getTime() : 0
        const rightTime = right.lastOpenedAt ? new Date(right.lastOpenedAt).getTime() : 0
        return rightTime - leftTime || left.title.localeCompare(right.title)
      })
  }, [courseId, materials, search])

  if (materialsQuery.isLoading) {
    return (
      <Stack spacing={2}>
        <Skeleton height={180} variant="rounded" />
        <Skeleton height={80} variant="rounded" />
        <Skeleton height={360} variant="rounded" />
      </Stack>
    )
  }

  if (materialsQuery.isError) {
    return (
      <Alert severity="error">
        {materialsQuery.error instanceof Error ? materialsQuery.error.message : 'Kaynaklar yüklenemedi.'}
      </Alert>
    )
  }

  return (
    <Stack spacing={3}>
      <StudentPageHero
        eyebrow="İçerik Keşfi"
        title="Kaynaklarım"
        description="Erişimde olan PDF kaynaklarını ders, kaynak adı ve son okuma durumuna göre tek ekrandan yönet."
        sideContent={
          <Paper sx={{ borderRadius: 3, p: 2.5 }} variant="outlined">
            <Typography color="text.secondary" sx={{ fontSize: 13, fontWeight: 800 }}>
              PDF KAYNAĞI
            </Typography>
            <Typography sx={{ fontSize: 42, fontWeight: 900 }}>{materials.length}</Typography>
            <Typography color="text.secondary" variant="body2">
              {materials.filter((material) => material.lastOpenedAt).length} kaynak daha önce açıldı.
            </Typography>
          </Paper>
        }
      />

      <Paper sx={{ borderRadius: 3, p: 2 }} variant="outlined">
        <Stack direction={{ md: 'row', xs: 'column' }} spacing={1.5}>
          <TextField
            fullWidth
            label="PDF veya ders ara"
            onChange={(event) => setSearch(event.target.value)}
            value={search}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlinedIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            label="Ders"
            onChange={(event) => setCourseId(event.target.value)}
            select
            sx={{ minWidth: { md: 260 } }}
            value={courseId}
          >
            <MenuItem value="">Tüm dersler</MenuItem>
            {courseOptions.map((course) => (
              <MenuItem key={course.id} value={course.id}>
                {course.name}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>

      {filteredMaterials.length === 0 ? (
        <EmptyState title="Kaynak bulunamadı" description="Arama veya ders filtresini değiştirerek tekrar dene." />
      ) : (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { lg: 'repeat(2, 1fr)', xs: '1fr' } }}>
          {filteredMaterials.map((material) => {
            const progress = Math.round(Number(material.progressPercentage ?? 0))

            return (
              <Paper key={material.materialId} sx={{ borderRadius: 3, p: 2.5 }} variant="outlined">
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                    <Box
                      sx={{
                        alignItems: 'center',
                        bgcolor: 'rgba(37,99,235,0.08)',
                        borderRadius: 2,
                        color: 'info.main',
                        display: 'flex',
                        flexShrink: 0,
                        height: 42,
                        justifyContent: 'center',
                        width: 42,
                      }}
                    >
                      <PictureAsPdfOutlinedIcon />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 900 }}>{material.title}</Typography>
                      <Typography color="text.secondary" variant="body2">
                        {material.courseName} · {material.sourceName}
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack spacing={0.75}>
                    <LinearProgress sx={{ borderRadius: 999, height: 8 }} value={progress} variant="determinate" />
                    <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                      <Typography color="text.secondary" variant="body2">
                        %{progress} okundu
                      </Typography>
                      <Typography color="text.secondary" variant="body2">
                        {material.pageCount} sayfa
                      </Typography>
                    </Stack>
                  </Stack>

                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                    <Chip label={`Son sayfa: ${material.lastPage ?? '-'}`} size="small" />
                    <Chip label={`Son açılım: ${formatDate(material.lastOpenedAt)}`} size="small" variant="outlined" />
                  </Stack>

                  <Button
                    component={RouterLink}
                    endIcon={<ArrowForwardOutlinedIcon />}
                    to={`/materials/viewer/${material.materialId}`}
                    variant="contained"
                  >
                    PDF'i aç
                  </Button>
                </Stack>
              </Paper>
            )
          })}
        </Box>
      )}
    </Stack>
  )
}

function formatDate(value?: string | null) {
  if (!value) return '-'

  return new Date(value).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
