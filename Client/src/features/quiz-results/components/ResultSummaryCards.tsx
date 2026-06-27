import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined'
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined'
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined'
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined'
import { Box, Paper, Typography } from '@mui/material'
import type { QuizResultDetail } from '../../../models/quizResult'

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes} dk ${secs} sn`
}

interface ResultSummaryCardsProps {
  result: QuizResultDetail
}

export function ResultSummaryCards({ result }: ResultSummaryCardsProps) {
  const cards = [
    { label: 'Puan', value: `%${result.score}`, color: '#0f766e' },
    { label: 'Doğru', value: result.correctCount, icon: <CheckCircleOutlineOutlinedIcon color="success" fontSize="small" /> },
    { label: 'Yanlış', value: result.wrongCount, icon: <HighlightOffOutlinedIcon color="error" fontSize="small" /> },
    { label: 'Boş', value: result.emptyCount },
    { label: 'Süre', value: formatDuration(result.durationSeconds), icon: <AccessTimeOutlinedIcon fontSize="small" /> },
    {
      label: 'Ort. soru süresi',
      value: `${Math.round(result.analytics.averageQuestionTimeSeconds)} sn`,
      icon: <SpeedOutlinedIcon fontSize="small" />,
    },
  ]

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: { lg: 'repeat(6, 1fr)', md: 'repeat(3, 1fr)', xs: 'repeat(2, 1fr)' },
      }}
    >
      {cards.map((card) => (
        <Paper key={card.label} sx={{ borderRadius: 3, p: 2 }} variant="outlined">
          <Typography color="text.secondary" variant="caption">
            {card.label}
          </Typography>
          <Box sx={{ alignItems: 'center', display: 'flex', gap: 0.5, mt: 0.5 }}>
            {card.icon}
            <Typography sx={{ color: card.color, fontSize: 24, fontWeight: 900 }}>{card.value}</Typography>
          </Box>
        </Paper>
      ))}
    </Box>
  )
}
