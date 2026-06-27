import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined'
import NoteAltOutlinedIcon from '@mui/icons-material/NoteAltOutlined'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined'
import WhatshotOutlinedIcon from '@mui/icons-material/WhatshotOutlined'
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'react-toastify'
import { MasteryLevel } from '../../models/review'
import { EmptyState } from '../../components/common/EmptyState'
import { StudentPageHero } from '../../components/common/StudentPageHero'
import { ReviewStatsCharts } from './components/ReviewStatsCharts'
import { useReviewStats, useStartReviewSession, useTodayReviews } from './hooks/useReviewQueries'
import { materialsApi } from '../../shared/api'
import type { ReviewMaterialNote } from '../../models'

function masteryLabel(level: MasteryLevel) {
  switch (level) {
    case MasteryLevel.Mastered:
      return 'Uzman'
    case MasteryLevel.Advanced:
      return 'İleri'
    case MasteryLevel.Intermediate:
      return 'Orta'
    default:
      return 'Başlangıç'
  }
}

function masteryColor(level: MasteryLevel): 'default' | 'success' | 'warning' | 'info' {
  switch (level) {
    case MasteryLevel.Mastered:
      return 'success'
    case MasteryLevel.Advanced:
      return 'info'
    case MasteryLevel.Intermediate:
      return 'warning'
    default:
      return 'default'
  }
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
}) {
  return (
    <Paper sx={{ borderRadius: 3, p: 2.5 }} variant="outlined">
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <Box sx={{ color: 'primary.main' }}>{icon}</Box>
        <Box>
          <Typography color="text.secondary" variant="body2">
            {label}
          </Typography>
          <Typography sx={{ fontSize: 28, fontWeight: 900 }}>{value}</Typography>
        </Box>
      </Stack>
    </Paper>
  )
}

export function TodayReviewsPage() {
  const queryClient = useQueryClient()
  const todayQuery = useTodayReviews()
  const statsQuery = useReviewStats()
  const startMutation = useStartReviewSession()
  const noteReviewsQuery = useQuery({
    queryKey: ['material-note-reviews'],
    queryFn: () => materialsApi.getDueNoteReviews({ take: 50 }),
  })
  const [noteReviewOpen, setNoteReviewOpen] = useState(false)
  const [noteIndex, setNoteIndex] = useState(0)
  const [answerVisible, setAnswerVisible] = useState(false)

  const items = todayQuery.data?.items ?? []
  const summary = todayQuery.data?.summary
  const noteReviews = noteReviewsQuery.data ?? []
  const currentNote = noteReviews[noteIndex]
  const noteReviewMutation = useMutation({
    mutationFn: ({ note, quality }: { note: ReviewMaterialNote; quality: number }) =>
      materialsApi.reviewNote(note.id, quality),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['material-note-reviews'] }),
        queryClient.invalidateQueries({ queryKey: ['student-content', 'notes'] }),
      ])
      if (noteIndex + 1 >= noteReviews.length) {
        setNoteReviewOpen(false)
        setNoteIndex(0)
        toast.success('Not tekrarları tamamlandı.')
      } else {
        setNoteIndex(0)
      }
      setAnswerVisible(false)
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Not tekrarı kaydedilemedi.'),
  })

  return (
    <Stack spacing={3}>
      <StudentPageHero
        description="SM-2 algoritması ile unutma eğrisine göre planlanan günlük tekrar kuyruğunuz."
        title="Bugün Tekrar Et"
      />

      {todayQuery.isLoading ? (
        <Skeleton height={120} variant="rounded" />
      ) : (
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <StatCard
            icon={<SchoolOutlinedIcon />}
            label="Bugün tekrar"
            value={summary?.dueTodayCount ?? 0}
          />
          <StatCard
            icon={<TrendingUpOutlinedIcon />}
            label="Uzmanlaşan"
            value={summary?.masteredCount ?? 0}
          />
          <StatCard
            icon={<WhatshotOutlinedIcon />}
            label="Günlük seri"
            value={summary?.dailyStreak ?? 0}
          />
          <StatCard
            icon={<PlayArrowOutlinedIcon />}
            label="Ort. başarı"
            value={`%${summary?.averageSuccessRate ?? 0}`}
          />
        </Stack>
      )}

      <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
        <Button
          disabled={startMutation.isPending || (summary?.dueTodayCount ?? 0) === 0}
          onClick={() => startMutation.mutate()}
          startIcon={<PlayArrowOutlinedIcon />}
          variant="contained"
        >
          {startMutation.isPending ? 'Başlatılıyor…' : 'Bugünkü Tekrarları Başlat'}
        </Button>
        <Button
          disabled={noteReviews.length === 0 || noteReviewsQuery.isLoading}
          onClick={() => {
            setNoteIndex(0)
            setAnswerVisible(false)
            setNoteReviewOpen(true)
          }}
          startIcon={<NoteAltOutlinedIcon />}
          variant="outlined"
        >
          Not Tekrarlarını Çalış ({noteReviews.length})
        </Button>
      </Stack>

      {todayQuery.isError && (
        <Alert severity="error">
          {todayQuery.error instanceof Error ? todayQuery.error.message : 'Liste yüklenemedi.'}
        </Alert>
      )}

      <Paper sx={{ borderRadius: 3, p: 2 }} variant="outlined">
        <Typography sx={{ fontWeight: 800, mb: 2 }} variant="h6">
          Tekrar kuyruğu
        </Typography>

        {items.length === 0 && !todayQuery.isLoading ? (
          <EmptyState
            description="Quiz çözdükçe sorular otomatik olarak tekrar planına eklenir. Önce birkaç soru çözün."
            title="Bugün vadesi gelen soru yok"
          />
        ) : (
          <TableContainer sx={{ maxHeight: 360, overflow: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Soru</TableCell>
                  <TableCell>Konu</TableCell>
                  <TableCell>Seviye</TableCell>
                  <TableCell>Sonraki</TableCell>
                  <TableCell align="right">Başarı</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                    <TableRow key={item.questionId}>
                      <TableCell>
                        {item.questionText.length > 80
                          ? `${item.questionText.slice(0, 80)}…`
                          : item.questionText}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{item.topicTitle}</Typography>
                        <Typography color="text.secondary" variant="caption">
                          {item.courseName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={masteryColor(item.masteryLevel)}
                          label={masteryLabel(item.masteryLevel)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {item.nextReviewAt
                          ? new Date(item.nextReviewAt).toLocaleDateString('tr-TR')
                          : '—'}
                      </TableCell>
                      <TableCell align="right">%{item.correctRate}</TableCell>
                    </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {statsQuery.isLoading && <Skeleton height={280} variant="rounded" />}
      {statsQuery.data && <ReviewStatsCharts stats={statsQuery.data} />}

      <Dialog fullWidth maxWidth="sm" open={noteReviewOpen} onClose={() => !noteReviewMutation.isPending && setNoteReviewOpen(false)}>
        <DialogTitle>
          Not tekrarı {currentNote ? `${noteIndex + 1} / ${noteReviews.length}` : ''}
        </DialogTitle>
        <DialogContent>
          {currentNote && (
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                <Chip label={currentNote.materialTitle} size="small" />
                <Chip label={`Sayfa ${currentNote.pageNumber}`} size="small" variant="outlined" />
                {currentNote.folderName && <Chip color="primary" label={currentNote.folderName} size="small" variant="outlined" />}
              </Stack>
              <Paper sx={{ borderRadius: 2, p: 2.5 }} variant="outlined">
                <Typography color="text.secondary" variant="caption">ÖN YÜZ</Typography>
                <Typography sx={{ fontWeight: 700, lineHeight: 1.8, mt: 1 }}>
                  {currentNote.prompt}
                </Typography>
              </Paper>
              {!answerVisible ? (
                <Button onClick={() => setAnswerVisible(true)} variant="contained">
                  Cevabı Göster
                </Button>
              ) : (
                <>
                  <Paper sx={{ bgcolor: 'rgba(20,184,166,0.06)', borderRadius: 2, p: 2.5 }} variant="outlined">
                    <Typography color="text.secondary" variant="caption">ARKA YÜZ</Typography>
                    <Typography sx={{ lineHeight: 1.8, mt: 1 }}>{currentNote.answer}</Typography>
                  </Paper>
                  <Typography sx={{ fontWeight: 700 }}>Ne kadar iyi hatırladın?</Typography>
                  <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
                    {[
                      { quality: 1, label: 'Hatırlamadım' },
                      { quality: 3, label: 'Zorlandım' },
                      { quality: 4, label: 'Hatırladım' },
                      { quality: 5, label: 'Çok kolaydı' },
                    ].map((option) => (
                      <Button
                        key={option.quality}
                        disabled={noteReviewMutation.isPending}
                        onClick={() => noteReviewMutation.mutate({ note: currentNote, quality: option.quality })}
                        size="small"
                        variant="outlined"
                      >
                        {option.label}
                      </Button>
                    ))}
                  </Stack>
                </>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button disabled={noteReviewMutation.isPending} onClick={() => setNoteReviewOpen(false)}>
            Kapat
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
