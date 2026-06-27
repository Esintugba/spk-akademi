import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material'
import { useQuizSessionStore } from '../../stores/quizSessionStore'
import { quizModeLabel } from './quizSessionUtils'

export function ResumeQuizModal() {
  const { resumePrompt, closeResumePrompt } = useQuizSessionStore()
  const session = resumePrompt.existingSession

  if (!session) {
    return null
  }

  const remainingMinutes = session.remainingTimeSeconds
    ? Math.ceil(session.remainingTimeSeconds / 60)
    : null

  return (
    <Dialog onClose={closeResumePrompt} open={resumePrompt.open}>
      <DialogTitle>Kaldığınız yerden devam etmek ister misiniz?</DialogTitle>
      <DialogContent>
        <Typography color="text.secondary" variant="body2">
          {quizModeLabel(session.quizMode)} — {session.title || 'Aktif oturum'}
        </Typography>
        {remainingMinutes != null && (
          <Typography sx={{ mt: 1 }} variant="body2">
            Kalan süre: yaklaşık {remainingMinutes} dakika
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={closeResumePrompt}>İptal</Button>
        <Button
          onClick={() => {
            resumePrompt.onRestart?.()
            closeResumePrompt()
          }}
        >
          Baştan Başlat
        </Button>
        <Button
          onClick={() => {
            resumePrompt.onResume?.()
            closeResumePrompt()
          }}
          variant="contained"
        >
          Devam Et
        </Button>
      </DialogActions>
    </Dialog>
  )
}
