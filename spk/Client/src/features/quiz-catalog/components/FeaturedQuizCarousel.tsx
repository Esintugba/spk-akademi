import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined'
import LocalFireDepartmentOutlinedIcon from '@mui/icons-material/LocalFireDepartmentOutlined'
import RecommendOutlinedIcon from '@mui/icons-material/RecommendOutlined'
import { Box, Chip, Paper, Stack, Typography } from '@mui/material'
import type { FeaturedQuiz } from '../../../models/quizCatalog'
import { difficultyLabel, durationLabel } from '../quizCatalogUtils'

interface FeaturedQuizCarouselProps {
  title: string
  variant?: 'featured' | 'recommended' | 'trending'
  quizzes: FeaturedQuiz[]
  onSelect: (quizId: string) => void
}

function iconForVariant(variant: FeaturedQuizCarouselProps['variant']) {
  if (variant === 'recommended') {
    return <RecommendOutlinedIcon />
  }

  if (variant === 'trending') {
    return <LocalFireDepartmentOutlinedIcon />
  }

  return <AutoAwesomeOutlinedIcon />
}

export function FeaturedQuizCarousel({
  title,
  variant = 'featured',
  quizzes,
  onSelect,
}: FeaturedQuizCarouselProps) {
  if (quizzes.length === 0) {
    return null
  }

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        {iconForVariant(variant)}
        <Typography sx={{ fontWeight: 900 }} variant="h6">
          {title}
        </Typography>
      </Stack>
      <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 0.5 }}>
        {quizzes.map((quiz) => (
          <Paper
            component="button"
            elevation={0}
            key={quiz.id}
            onClick={() => onSelect(quiz.id)}
            sx={{
              bgcolor: 'background.paper',
              border: '1px solid rgba(148,163,184,0.22)',
              borderRadius: 2,
              cursor: 'pointer',
              flex: '0 0 280px',
              p: 2,
              textAlign: 'left',
            }}
          >
            <Stack spacing={1.25}>
              <Typography sx={{ fontWeight: 850, lineHeight: 1.25 }}>{quiz.title}</Typography>
              <Typography color="text.secondary" variant="body2">
                {quiz.licenseName ?? 'Genel'} · {durationLabel(quiz.duration)} · {quiz.questionCount} soru
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                <Chip label={difficultyLabel(quiz.difficultyLevel)} size="small" />
                <Chip label={`Ort. %${quiz.averageScore}`} size="small" variant="outlined" />
                <Chip label={quiz.isFree ? 'Ücretsiz' : 'Premium'} size="small" variant="outlined" />
              </Stack>
            </Stack>
          </Paper>
        ))}
      </Box>
    </Stack>
  )
}
