import { useEffect, useState } from 'react'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined'
import { Alert, Button, Chip, Paper, Skeleton, Stack, Typography } from '@mui/material'
import { Link as RouterLink, useParams } from 'react-router'
import type { TrialAttemptDetail } from '../../models'
import { api } from '../../shared/api'
import { EmptyState } from '../common/EmptyState'
import { StudentPageHero } from '../common/StudentPageHero'

export function TrialAttemptDetailPage() {
  const { attemptId } = useParams()
  const [detail, setDetail] = useState<TrialAttemptDetail | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadDetail() {
      if (!attemptId) {
        setError('Deneme kaydı bulunamadı.')
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError('')

      try {
        setDetail(await api.getStudentTrialHistoryDetail(attemptId))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Deneme detayı yüklenemedi.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadDetail()
  }, [attemptId])

  if (isLoading) {
    return (
      <Stack spacing={2}>
        <Skeleton height={220} variant="rounded" />
        <Skeleton height={400} variant="rounded" />
      </Stack>
    )
  }

  if (error && !detail) {
    return <Alert severity="error">{error}</Alert>
  }

  if (!detail) {
    return <EmptyState title="Detay bulunamadı" description="Seçtiğin deneme için analiz verisi alınamadı." />
  }

  return (
    <Stack spacing={3}>
      <StudentPageHero
        eyebrow="Deneme Analizi"
        title={detail.trialTitle}
        description="Soru bazlı analizle nerede doğru yaptığını, nerede kaçırdığını ve açıklamaları birlikte incele."
        sideContent={
          <Paper sx={{ borderRadius: 3, p: 3 }} variant="outlined">
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
              <Chip color="success" label={`${detail.correctCount} doğru`} />
              <Chip color="error" label={`${detail.wrongCount} yanlış`} />
              <Chip label={`%${detail.successRate} başarı`} />
              <Chip label={`${detail.usedMinutes} dakika`} />
            </Stack>
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              {formatDateTime(detail.finishedAt || detail.startedAt)}
            </Typography>
            <Button
              component={RouterLink}
              sx={{ mt: 2 }}
              to={`/quiz/results/${detail.attemptId}`}
              variant="contained"
            >
              Açıklamalı sonuç ekranı
            </Button>
          </Paper>
        }
      />

      {error && <Alert severity="error">{error}</Alert>}

      <Stack spacing={2}>
        {detail.answers.map((answer, index) => (
          <Paper key={answer.questionId} sx={{ borderRadius: 3, p: 3 }} variant="outlined">
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h2">
                  {index + 1}. {answer.questionText}
                </Typography>
                <Chip
                  color={answer.isCorrect ? 'success' : 'error'}
                  icon={answer.isCorrect ? <CheckCircleOutlinedIcon /> : <HighlightOffOutlinedIcon />}
                  label={answer.isCorrect ? 'Doğru' : 'Yanlış'}
                />
              </Stack>
              <Typography color="text.secondary">Seçilen seçenek: {answer.selectedOptionId || 'Boş bırakıldı'}</Typography>
              <Typography color="text.secondary">Doğru seçenek: {answer.correctOptionId}</Typography>
              <Typography sx={{ whiteSpace: 'pre-line' }}>{answer.explanation}</Typography>
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Stack>
  )
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}
