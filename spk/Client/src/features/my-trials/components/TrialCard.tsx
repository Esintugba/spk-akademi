import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined'
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined'
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined'
import ReplayOutlinedIcon from '@mui/icons-material/ReplayOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material'
import {
  StudentTrialProgressStatus,
  type StudentAccessibleTrial,
} from '../../../models/trialQuiz'

interface TrialCardProps {
  trial: StudentAccessibleTrial
  isStarting: boolean
  onStart: (trial: StudentAccessibleTrial) => void
  onContinue: (trial: StudentAccessibleTrial) => void
  onViewResults: (trial: StudentAccessibleTrial) => void
}

function statusLabel(status: StudentTrialProgressStatus) {
  switch (status) {
    case StudentTrialProgressStatus.InProgress:
      return 'Devam ediyor'
    case StudentTrialProgressStatus.Completed:
      return 'Tamamlandı'
    default:
      return 'Başlamadı'
  }
}

function statusColor(status: StudentTrialProgressStatus): 'default' | 'warning' | 'success' {
  switch (status) {
    case StudentTrialProgressStatus.InProgress:
      return 'warning'
    case StudentTrialProgressStatus.Completed:
      return 'success'
    default:
      return 'default'
  }
}

export function TrialCard({ trial, isStarting, onStart, onContinue, onViewResults }: TrialCardProps) {
  const licenseLabel = trial.isFree
    ? 'Ücretsiz'
    : trial.licenseName ?? 'Lisanslı'

  const action =
    trial.progressStatus === StudentTrialProgressStatus.Completed ? (
      <Button
        fullWidth
        onClick={() => onViewResults(trial)}
        startIcon={<VisibilityOutlinedIcon />}
        variant="outlined"
      >
        Sonuçları Gör
      </Button>
    ) : trial.progressStatus === StudentTrialProgressStatus.InProgress ? (
      <Button
        color="warning"
        fullWidth
        onClick={() => onContinue(trial)}
        startIcon={<ReplayOutlinedIcon />}
        variant="contained"
      >
        Devam Et
      </Button>
    ) : (
      <Button
        disabled={isStarting}
        fullWidth
        onClick={() => onStart(trial)}
        startIcon={<PlayArrowOutlinedIcon />}
        variant="contained"
      >
        Denemeyi Başlat
      </Button>
    )

  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid rgba(148,163,184,0.2)',
        borderRadius: 3,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        p: 2.5,
      }}
    >
      <Stack spacing={2} sx={{ flexGrow: 1 }}>
        <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between' }}>
          <Typography sx={{ fontWeight: 800 }} variant="h6">
            {trial.title}
          </Typography>
          <Chip color={statusColor(trial.progressStatus)} label={statusLabel(trial.progressStatus)} size="small" />
        </Stack>

        <Chip label={licenseLabel} size="small" sx={{ alignSelf: 'flex-start' }} variant="outlined" />

        <Stack spacing={1}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <AccessTimeOutlinedIcon color="action" fontSize="small" />
            <Typography color="text.secondary" variant="body2">
              Süre: {trial.durationMinutes} dk
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <QuizOutlinedIcon color="action" fontSize="small" />
            <Typography color="text.secondary" variant="body2">
              Soru: {trial.questionCount}
            </Typography>
          </Stack>
          {trial.progressStatus === StudentTrialProgressStatus.InProgress &&
            trial.remainingTimeSeconds != null && (
              <Box>
                <Typography color="warning.main" sx={{ fontWeight: 700 }} variant="body2">
                  Kalan süre: {Math.ceil(trial.remainingTimeSeconds / 60)} dk
                </Typography>
              </Box>
            )}
        </Stack>
      </Stack>

      <Box sx={{ mt: 2 }}>{action}</Box>
    </Paper>
  )
}
