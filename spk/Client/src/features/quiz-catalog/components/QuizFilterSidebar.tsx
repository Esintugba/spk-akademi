import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import {
  Button,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import type { Course, License, Topic } from '../../../models'
import type { QuizCatalogFilters } from '../../../models/quizCatalog'

interface QuizFilterSidebarProps {
  courses: Course[]
  filters: QuizCatalogFilters
  licenses: License[]
  topics: Topic[]
  onChange: <K extends keyof QuizCatalogFilters>(key: K, value: QuizCatalogFilters[K]) => void
  onReset: () => void
}

export function QuizFilterSidebar({
  courses,
  filters,
  licenses,
  topics,
  onChange,
  onReset,
}: QuizFilterSidebarProps) {
  const visibleCourses = filters.licenseId
    ? courses.filter((course) => course.licenseId === filters.licenseId)
    : courses
  const visibleTopics = filters.courseId
    ? topics.filter((topic) => topic.courseId === filters.courseId)
    : topics

  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid rgba(148,163,184,0.22)',
        borderRadius: 2,
        p: 2,
        position: { lg: 'sticky', xs: 'static' },
        top: 96,
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ fontWeight: 850 }}>Filtreler</Typography>
          <Button onClick={onReset} size="small" startIcon={<RestartAltOutlinedIcon />}>
            Sıfırla
          </Button>
        </Stack>

        <TextField
          fullWidth
          label="Ara"
          onChange={(event) => onChange('search', event.target.value)}
          size="small"
          value={filters.search ?? ''}
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

        <FormControl fullWidth size="small">
          <InputLabel>Lisans</InputLabel>
          <Select
            label="Lisans"
            onChange={(event) => {
              onChange('licenseId', event.target.value || undefined)
              onChange('courseId', undefined)
              onChange('topicId', undefined)
            }}
            value={filters.licenseId ?? ''}
          >
            <MenuItem value="">Tümü</MenuItem>
            {licenses.map((license) => (
              <MenuItem key={license.id} value={license.id}>
                {license.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel>Ders</InputLabel>
          <Select
            label="Ders"
            onChange={(event) => {
              onChange('courseId', event.target.value || undefined)
              onChange('topicId', undefined)
            }}
            value={filters.courseId ?? ''}
          >
            <MenuItem value="">Tümü</MenuItem>
            {visibleCourses.map((course) => (
              <MenuItem key={course.id} value={course.id}>
                {course.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel>Konu</InputLabel>
          <Select
            label="Konu"
            onChange={(event) => onChange('topicId', event.target.value || undefined)}
            value={filters.topicId ?? ''}
          >
            <MenuItem value="">Tümü</MenuItem>
            {visibleTopics.map((topic) => (
              <MenuItem key={topic.id} value={topic.id}>
                {topic.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel>Zorluk</InputLabel>
          <Select
            label="Zorluk"
            onChange={(event) => onChange('difficulty', event.target.value as QuizCatalogFilters['difficulty'])}
            value={filters.difficulty ?? ''}
          >
            <MenuItem value="">Tümü</MenuItem>
            <MenuItem value="easy">Kolay</MenuItem>
            <MenuItem value="medium">Orta</MenuItem>
            <MenuItem value="hard">Zor</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel>Durum</InputLabel>
          <Select
            label="Durum"
            onChange={(event) => onChange('status', event.target.value as QuizCatalogFilters['status'])}
            value={filters.status ?? ''}
          >
            <MenuItem value="">Tümü</MenuItem>
            <MenuItem value="available">Tamamlanmamış</MenuItem>
            <MenuItem value="in-progress">Devam Ediyor</MenuItem>
            <MenuItem value="completed">Tamamlandı</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel>Erişim</InputLabel>
          <Select
            label="Erişim"
            onChange={(event) => {
              const value = event.target.value as '' | 'free' | 'premium'
              onChange('isFree', value === '' ? undefined : value === 'free')
            }}
            value={filters.isFree === undefined ? '' : filters.isFree ? 'free' : 'premium'}
          >
            <MenuItem value="">Tümü</MenuItem>
            <MenuItem value="free">Ücretsiz</MenuItem>
            <MenuItem value="premium">Premium</MenuItem>
          </Select>
        </FormControl>
      </Stack>
    </Paper>
  )
}
