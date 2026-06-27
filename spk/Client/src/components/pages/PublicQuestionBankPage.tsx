import { useCallback, useEffect, useState } from 'react'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import { Alert, Box, Button, Chip, Container, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import { ContentAccessLevel, type PublicExampleTrial, type PublicMiniQuizResult, type PublicQuestion } from '../../models'
import { api } from '../../shared/api'
import { MarketingHero } from '../common/MarketingHero'
import { MarketingSectionHeading } from '../common/MarketingSectionHeading'
import { marketingCardSx, marketingGridSx, marketingPageSx, marketingSectionSx } from '../common/marketingStyles'

const accessOptions = [
  { label: 'Free', value: ContentAccessLevel.Free },
  { label: 'Trial', value: ContentAccessLevel.Trial },
]

export function PublicQuestionBankPage() {
  const [accessLevel, setAccessLevel] = useState(ContentAccessLevel.Free)
  const [questions, setQuestions] = useState<PublicQuestion[]>([])
  const [exampleTrials, setExampleTrials] = useState<PublicExampleTrial[]>([])
  const [search, setSearch] = useState('')
  const [quizQuestions, setQuizQuestions] = useState<PublicQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<PublicMiniQuizResult | null>(null)
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    setError('')
    try {
      const [questionResponse, trialResponse] = await Promise.all([
        api.getPublicQuestionBank({ accessLevel }),
        api.getPublicExampleTrials(accessLevel),
      ])

      setQuestions(questionResponse)
      setExampleTrials(trialResponse)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Public içerikler alınamadı.')
    }
  }, [accessLevel])

  useEffect(() => {
    void loadData()
  }, [loadData])

  async function startMiniQuiz() {
    const items = await api.startPublicMiniQuiz({ accessLevel, questionCount: 5 })
    setQuizQuestions(items)
    setAnswers({})
    setResult(null)
  }

  async function submitMiniQuiz() {
    const response = await api.submitPublicMiniQuiz(
      quizQuestions.map((question) => ({
        questionId: question.id,
        selectedOptionId: answers[question.id] || null,
      })),
    )

    setResult(response)
  }

  const filteredQuestions = questions.filter((question) => {
    const term = search.trim().toLocaleLowerCase('tr-TR')
    if (!term) {
      return true
    }

    return [question.text, question.topicTitle]
      .join(' ')
      .toLocaleLowerCase('tr-TR')
      .includes(term)
  })

  return (
    <Box sx={marketingPageSx}>
      <MarketingHero
        eyebrow="Public Soru Bankası"
        title="Onaylı örnek sorular ve mini quizler."
        description="Public tarafta yalnızca onaylı içerikler görünür. Free ve Trial seviyesine göre filtrelenmiş soru bankası ve örnek deneme listeleri bu ekranda yer alır."
        actions={
          <Button startIcon={<PlayArrowRoundedIcon />} variant="contained" onClick={() => void startMiniQuiz()}>
            Mini quiz başlat
          </Button>
        }
      />

      <Container maxWidth="xl" sx={marketingSectionSx}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Paper sx={{ borderRadius: 2, p: { md: 2, xs: 1.5 }, mb: 3 }} variant="outlined">
          <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { md: 'minmax(0, 1fr) 240px', xs: '1fr' } }}>
            <TextField fullWidth label="Sorularda ara" size="small" value={search} onChange={(event) => setSearch(event.target.value)} />
            <TextField fullWidth label="Erişim seviyesi" select size="small" value={accessLevel} onChange={(event) => setAccessLevel(Number(event.target.value) as ContentAccessLevel)}>
              {accessOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
            </TextField>
          </Box>
        </Paper>

        <MarketingSectionHeading
          eyebrow="Soru Bankası"
          title="Örnek sorular"
          description="Bu listede yalnızca onaylı ve public erişime açılmış sorular yer alır."
        />
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { lg: 'repeat(3, minmax(0, 1fr))', md: 'repeat(2, minmax(0, 1fr))', xs: '1fr' } }}>
          {filteredQuestions.map((question) => (
            <Paper key={question.id} sx={{ ...marketingCardSx, display: 'flex', flexDirection: 'column', minHeight: 260 }} variant="outlined">
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, minHeight: 28 }}>
                <Chip color="primary" label={question.topicTitle} size="small" />
                <Chip label={accessOptions.find((option) => option.value === question.accessLevel)?.label || 'Free'} size="small" />
              </Stack>
              <Typography sx={{ fontSize: 18, fontWeight: 900, lineHeight: 1.35, mt: 1.5 }}>{question.text}</Typography>
            </Paper>
          ))}
        </Box>

        <Box sx={marketingSectionSx}>
          <MarketingSectionHeading
            eyebrow="Örnek Denemeler"
            title="Public örnek deneme listesi"
            description="Public erişim seviyesine açılmış örnek denemeler burada listelenir."
          />
          <Box sx={marketingGridSx}>
            {exampleTrials.map((trial) => (
              <Paper key={trial.id} sx={{ ...marketingCardSx, display: 'flex', flexDirection: 'column' }} variant="outlined">
                <Typography sx={{ fontSize: 20, fontWeight: 900, lineHeight: 1.25 }}>{trial.title}</Typography>
                <Typography color="text.secondary" sx={{ lineHeight: 1.8, mt: 1.25 }}>{trial.description}</Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mt: 'auto', pt: 2 }}>
                  <Chip label={`${trial.durationMinutes} dk`} size="small" />
                  <Chip label={`${trial.questionCount} soru`} size="small" />
                </Stack>
              </Paper>
            ))}
          </Box>
        </Box>
      </Container>

      <Dialog fullWidth maxWidth="md" open={quizQuestions.length > 0} onClose={() => setQuizQuestions([])}>
        <DialogTitle>Public mini quiz</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {quizQuestions.map((question, index) => (
              <Paper key={question.id} sx={{ borderRadius: 3, p: 2 }} variant="outlined">
                <Typography sx={{ fontWeight: 800 }}>{index + 1}. {question.text}</Typography>
                <Stack spacing={1} sx={{ mt: 1.5 }}>
                  {question.options.map((option) => (
                    <Button
                      key={option.id}
                      sx={{ justifyContent: 'flex-start' }}
                      variant={answers[question.id] === option.id ? 'contained' : 'outlined'}
                      onClick={() => setAnswers((current) => ({ ...current, [question.id]: option.id }))}
                    >
                      {option.label}) {option.text}
                    </Button>
                  ))}
                </Stack>
              </Paper>
            ))}

            {result && (
              <Alert severity="success">
                Başarı oranı %{result.successRate} · Doğru: {result.correctCount} · Yanlış: {result.wrongCount}
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuizQuestions([])}>Kapat</Button>
          <Button variant="contained" onClick={() => void submitMiniQuiz()}>
            Sonuçları gör
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
