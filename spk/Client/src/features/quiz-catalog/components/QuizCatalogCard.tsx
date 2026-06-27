import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined'
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined'
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined'
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material'
import type { QuizCatalogItem } from '../../../models/quizCatalog'
import { difficultyLabel, durationLabel, progressLabel, quizCtaLabel } from '../quizCatalogUtils'

interface QuizCatalogCardProps {
  quiz: QuizCatalogItem
  isStarting?: boolean
  onOpen: (quiz: QuizCatalogItem) => void
  onPrimaryAction: (quiz: QuizCatalogItem) => void
}

export function QuizCatalogCard({ quiz, isStarting = false, onOpen, onPrimaryAction }: QuizCatalogCardProps) {
  const progress = progressLabel(quiz.userProgress)
  const progressColor = quiz.userProgress.completed ? 'success' : quiz.userProgress.inProgress ? 'warning' : 'default'

  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid rgba(148,163,184,0.22)',
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        p: 2.25,
      }}
    >
      <Stack spacing={1.5} sx={{ flexGrow: 1 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Typography sx={{ fontWeight: 850, lineHeight: 1.25 }} variant="h6">
            {quiz.title}
          </Typography>
          <Chip color={progressColor} label={progress} size="small" />
        </Stack>

        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Chip label={quiz.licenseName ?? 'Genel'} size="small" variant="outlined" />
          <Chip label={difficultyLabel(quiz.difficultyLevel)} size="small" />
          <Chip color={quiz.isFree ? 'success' : 'primary'} label={quiz.isFree ? 'Ücretsiz' : 'Premium'} size="small" variant="outlined" />
        </Stack>

        <Typography color="text.secondary" sx={{ minHeight: 44 }} variant="body2">
          {quiz.description || 'Bu deneme için açıklama henüz eklenmedi.'}
        </Typography>

        <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <Stack spacing={0.25}>
            <AccessTimeOutlinedIcon color="action" fontSize="small" />
            <Typography sx={{ fontWeight: 800 }} variant="body2">
              {durationLabel(quiz.duration)}
            </Typography>
          </Stack>
          <Stack spacing={0.25}>
            <QuizOutlinedIcon color="action" fontSize="small" />
            <Typography sx={{ fontWeight: 800 }} variant="body2">
              {quiz.questionCount} soru
            </Typography>
          </Stack>
          <Stack spacing={0.25}>
            <InsightsOutlinedIcon color="action" fontSize="small" />
            <Typography sx={{ fontWeight: 800 }} variant="body2">
              %{quiz.averageScore}
            </Typography>
          </Stack>
        </Box>
      </Stack>

      <Stack direction="row" spacing={1.25} sx={{ mt: 2 }}>
        <Button fullWidth onClick={() => onOpen(quiz)} startIcon={<VisibilityOutlinedIcon />} variant="outlined">
          Detay
        </Button>
        <Button
          disabled={isStarting}
          fullWidth
          onClick={() => onPrimaryAction(quiz)}
          startIcon={<PlayArrowOutlinedIcon />}
          variant="contained"
        >
          {quizCtaLabel(quiz)}
        </Button>
      </Stack>
    </Paper>
  )
}
