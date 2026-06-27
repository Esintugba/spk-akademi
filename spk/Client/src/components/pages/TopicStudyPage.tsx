import { useEffect, useMemo, useState } from 'react'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import OndemandVideoOutlinedIcon from '@mui/icons-material/OndemandVideoOutlined'
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import { Link as RouterLink, useParams } from 'react-router'
import { TopicType, type TopicStudyPageData } from '../../models'
import { api } from '../../shared/api'
import { EmptyState } from '../common/EmptyState'
import { StudentPageHero } from '../common/StudentPageHero'

export function TopicStudyPage() {
  const { topicId } = useParams()
  const [data, setData] = useState<TopicStudyPageData | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    async function loadPage() {
      if (!topicId) {
        setError('Konu bilgisi bulunamadı.')
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError('')

      try {
        setData(await api.getTopicStudyPage(topicId))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Konu çalışma ekranı yüklenemedi.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadPage()
  }, [topicId])

  async function handleCompletionToggle() {
    if (!data) {
      return
    }

    setIsSaving(true)
    setError('')

    try {
      await api.markTopicCompleted(data.topicId, !data.isCompleted)
      setData(await api.getTopicStudyPage(data.topicId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Konu durumu güncellenemedi.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDownloadDocument(documentId: string, fileName: string) {
    try {
      const file = await api.downloadSourceDocument(documentId)
      const url = window.URL.createObjectURL(file)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF indirilemedi.')
    }
  }

  const successColor = useMemo(() => {
    if (!data) {
      return 'primary'
    }
    if (data.successRate >= 75) {
      return 'success'
    }
    if (data.successRate >= 50) {
      return 'warning'
    }
    return 'error'
  }, [data])

  if (isLoading) {
    return (
      <Stack spacing={2}>
        <Skeleton height={220} variant="rounded" />
        <Skeleton height={260} variant="rounded" />
        <Skeleton height={340} variant="rounded" />
      </Stack>
    )
  }

  if (error && !data) {
    return <Alert severity="error">{error}</Alert>
  }

  if (!data) {
    return <EmptyState title="Konu bulunamadı" description="Seçtiğin konuya şu anda erişilemiyor." />
  }

  const subTopics = data.subTopics ?? []
  const showSubTopics = data.type === TopicType.MainTopic || subTopics.length > 0

  return (
    <Stack spacing={3}>
      <StudentPageHero
        eyebrow="Konu Çalışma"
        title={data.topicTitle}
        description={`${data.licenseName} > ${data.courseName} akışında bu konuyu çalış, notları aç ve kısa testle pekiştir.`}
        actions={
          <>
            <Button component={RouterLink} startIcon={<QuizOutlinedIcon />} to={`/quiz?topicId=${data.topicId}`} variant="contained">
              Mini Teste Geç
            </Button>
            <Button disabled={isSaving} onClick={() => void handleCompletionToggle()} startIcon={<CheckCircleOutlinedIcon />} variant="outlined">
              {data.isCompleted ? 'Tamamlandı işaretini kaldır' : 'Bu konuyu tamamla'}
            </Button>
          </>
        }
        sideContent={
          <Paper sx={{ borderRadius: 3, p: 3 }} variant="outlined">
            <Stack spacing={1.25}>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                <Chip icon={<SchoolOutlinedIcon />} label={data.licenseName} />
                <Chip label={data.courseName} variant="outlined" />
                <Chip color={data.isCompleted ? 'success' : 'default'} label={data.isCompleted ? 'Tamamlandı' : 'Çalışılıyor'} />
              </Stack>
              <Typography color="text.secondary">
                Son başarı oranı %{data.successRate} · {data.correctCount} doğru · {data.wrongCount} yanlış
              </Typography>
              <LinearProgress color={successColor} sx={{ borderRadius: 999, height: 10, mt: 1 }} value={Number(data.successRate)} variant="determinate" />
            </Stack>
          </Paper>
        }
      />

      {error && <Alert severity="error">{error}</Alert>}

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { lg: '1.6fr 1fr', xs: '1fr' } }}>
        <Stack spacing={3}>
          <Paper sx={{ borderRadius: 3, p: 3 }} variant="outlined">
            <Typography variant="h2">Konu Özeti</Typography>
            <Typography color="text.secondary" sx={{ lineHeight: 1.8, mt: 1.5, whiteSpace: 'pre-line' }}>
              {data.summary || 'Bu konu için henüz özet eklenmedi.'}
            </Typography>

            {(data.importantPoints || data.commonMistakes || data.formulas) && (
              <Stack spacing={2} sx={{ mt: 3 }}>
                {data.importantPoints && (
                  <Box>
                    <Typography sx={{ fontWeight: 700 }}>Önemli Noktalar</Typography>
                    <Typography color="text.secondary" sx={{ mt: 0.75, whiteSpace: 'pre-line' }}>
                      {data.importantPoints}
                    </Typography>
                  </Box>
                )}
                {data.commonMistakes && (
                  <Box>
                    <Typography sx={{ fontWeight: 700 }}>Sık Yapılan Hatalar</Typography>
                    <Typography color="text.secondary" sx={{ mt: 0.75, whiteSpace: 'pre-line' }}>
                      {data.commonMistakes}
                    </Typography>
                  </Box>
                )}
                {data.formulas && (
                  <Box>
                    <Typography sx={{ fontWeight: 700 }}>Formüller ve Hatırlatmalar</Typography>
                    <Typography color="text.secondary" sx={{ mt: 0.75, whiteSpace: 'pre-line' }}>
                      {data.formulas}
                    </Typography>
                  </Box>
                )}
              </Stack>
            )}
          </Paper>

          {showSubTopics && (
            <Paper sx={{ borderRadius: 3, p: 3 }} variant="outlined">
              <Typography variant="h2">Alt Konular</Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
                Bu ana konunun alt başlıklarını sırayla çalışabilir veya her biri için test çözebilirsin.
              </Typography>
              {subTopics.length === 0 ? (
                <Box sx={{ mt: 2 }}>
                  <EmptyState title="Alt konu henüz eklenmemiş" description="Bu ana konuya alt konu eklendiğinde çalışma ve test bağlantıları burada görünecek." />
                </Box>
              ) : (
                <Stack spacing={1.5} sx={{ mt: 2 }}>
                  {subTopics.map((subTopic) => (
                    <Paper key={subTopic.topicId} sx={{ borderRadius: 2.5, p: 2 }} variant="outlined">
                      <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1.5} sx={{ alignItems: { sm: 'center', xs: 'flex-start' }, justifyContent: 'space-between' }}>
                        <Box sx={{ minWidth: 0 }}>
                          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                            <Typography sx={{ fontWeight: 800 }}>{subTopic.title}</Typography>
                            <Chip color={subTopic.isCompleted ? 'success' : 'default'} label={subTopic.isCompleted ? 'Tamamlandı' : 'Alt konu'} size="small" />
                          </Stack>
                          <Typography color="text.secondary" sx={{ mt: 0.75 }} variant="body2">
                            {subTopic.questionCount} soru · %{subTopic.successRate} başarı · {subTopic.correctCount} doğru · {subTopic.wrongCount} yanlış
                          </Typography>
                          {subTopic.summary && (
                            <Typography color="text.secondary" sx={{ mt: 0.75 }} variant="body2">
                              {subTopic.summary.length > 150 ? `${subTopic.summary.slice(0, 150)}...` : subTopic.summary}
                            </Typography>
                          )}
                        </Box>
                        <Stack direction="row" spacing={1}>
                          <Button component={RouterLink} size="small" to={`/study/${subTopic.topicId}`} variant="outlined">
                            Çalış
                          </Button>
                          <Button component={RouterLink} size="small" to={`/quiz?topicId=${subTopic.topicId}`} variant="text">
                            Test Çöz
                          </Button>
                        </Stack>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Paper>
          )}

          <Paper sx={{ borderRadius: 3, p: 3 }} variant="outlined">
            <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 1.5 }}>
              <ArticleOutlinedIcon color="primary" />
              <Typography variant="h2">Notlar ve PDF İçerikleri</Typography>
            </Stack>

            <Stack spacing={2.5}>
              {data.notes.length === 0 && data.sourceDocuments.length === 0 ? (
                <EmptyState title="İçerik henüz eklenmemiş" description="Bu konu için not veya PDF kaynağı eklendiğinde burada göreceksin." />
              ) : (
                <>
                  {data.notes.map((note) => (
                    <Paper key={note.id} sx={{ bgcolor: '#f8fafc', borderRadius: 3, p: 2.5 }} variant="outlined">
                      <Typography sx={{ fontWeight: 700 }}>{note.title}</Typography>
                      <Typography color="text.secondary" sx={{ mt: 1, whiteSpace: 'pre-line' }}>
                        {note.content}
                      </Typography>
                      {note.sourceReference && (
                        <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
                          Kaynak: {note.sourceReference}
                        </Typography>
                      )}
                    </Paper>
                  ))}

                  {data.sourceDocuments.length > 0 && (
                    <Stack spacing={1.5}>
                      {data.sourceDocuments.map((document) => (
                        <Paper key={document.id} sx={{ borderRadius: 3, p: 2 }} variant="outlined">
                          <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1.5} sx={{ justifyContent: 'space-between' }}>
                            <Box>
                              <Typography sx={{ fontWeight: 700 }}>{document.title}</Typography>
                              <Typography color="text.secondary" variant="body2">
                                {document.fileName} · {document.pageCount} sayfa
                              </Typography>
                            </Box>
                            <Stack direction="row" spacing={1}>
                              <Button component={RouterLink} to={`/materials/viewer/${document.id}`} variant="contained">
                                PDF Aç
                              </Button>
                              <Button onClick={() => void handleDownloadDocument(document.id, document.fileName)} variant="outlined">
                                PDF İndir
                              </Button>
                            </Stack>
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  )}
                </>
              )}
            </Stack>
          </Paper>
        </Stack>

        <Stack spacing={3}>
          <Paper sx={{ borderRadius: 3, p: 3 }} variant="outlined">
            <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 1.5 }}>
              <OndemandVideoOutlinedIcon color="primary" />
              <Typography variant="h2">Video Alanı</Typography>
            </Stack>
            <Box
              sx={{
                alignItems: 'center',
                aspectRatio: '16 / 9',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
                borderRadius: 3,
                color: '#fff',
                display: 'flex',
                justifyContent: 'center',
                px: 3,
                textAlign: 'center',
              }}
            >
              <Stack spacing={1}>
                <Typography sx={{ fontWeight: 800 }}>{data.video.title}</Typography>
                <Typography sx={{ color: '#cbd5e1' }}>{data.video.description}</Typography>
              </Stack>
            </Box>
          </Paper>

          <Paper sx={{ borderRadius: 3, p: 3 }} variant="outlined">
            <Typography variant="h2">İlgili Sorular</Typography>
            {data.relatedQuestions.length === 0 ? (
              <EmptyState title="Henüz soru yok" description="Bu konu için onaylı sorular eklendiğinde burada görünecek." />
            ) : (
              <List disablePadding sx={{ mt: 1.5 }}>
                {data.relatedQuestions.map((question, index) => (
                  <Box key={question.questionId}>
                    {index > 0 && <Divider />}
                    <ListItem disableGutters sx={{ py: 1.5 }}>
                      <ListItemText primary={question.text} secondary={`${question.difficulty} · ${question.type}`} />
                    </ListItem>
                  </Box>
                ))}
              </List>
            )}
          </Paper>
        </Stack>
      </Box>
    </Stack>
  )
}
