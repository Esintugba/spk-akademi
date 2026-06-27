import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined'
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined'
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Stack,
  Typography,
} from '@mui/material'
import { memo } from 'react'
import { QuestionDifficulty } from '../../../models/enums'
import type { QuizResultDetailAnswer } from '../../../models/quizResult'
import { useQuizResultStore } from '../../../stores/quizResultStore'

function difficultyLabel(value: QuestionDifficulty) {
  switch (value) {
    case QuestionDifficulty.Easy:
      return 'Kolay'
    case QuestionDifficulty.Hard:
      return 'Zor'
    default:
      return 'Orta'
  }
}

interface QuestionSolutionCardProps {
  answer: QuizResultDetailAnswer
  index: number
}

function QuestionSolutionCardComponent({ answer, index }: QuestionSolutionCardProps) {
  const expanded = useQuizResultStore((s) => s.expandedQuestionIds[answer.questionId] ?? answer.explanation?.defaultExpanded ?? !answer.isCorrect)
  const setExpanded = useQuizResultStore((s) => s.setExpanded)

  const borderColor = answer.isCorrect ? 'rgba(34,197,94,0.45)' : 'rgba(248,113,113,0.55)'
  const bgColor = answer.isCorrect ? 'rgba(34,197,94,0.06)' : 'rgba(248,113,113,0.06)'

  return (
    <Box
      sx={{
        bgcolor: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: 3,
        overflow: 'hidden',
      }}
    >
      <Box sx={{ p: 2.5 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography sx={{ fontWeight: 800, pr: 1 }} variant="subtitle1">
            {index + 1}. {answer.questionText}
          </Typography>
          <Chip
            color={answer.isCorrect ? 'success' : 'error'}
            icon={answer.isCorrect ? <CheckCircleOutlineOutlinedIcon /> : <HighlightOffOutlinedIcon />}
            label={answer.isEmpty ? 'Boş' : answer.isCorrect ? 'Doğru' : 'Yanlış'}
            size="small"
          />
        </Stack>

        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mb: 2 }}>
          <Chip label={answer.lessonName} size="small" variant="outlined" />
          <Chip label={answer.topicName} size="small" variant="outlined" />
          <Chip label={difficultyLabel(answer.difficultyLevel)} size="small" />
          {answer.timeSpentSeconds != null && (
            <Chip label={`${answer.timeSpentSeconds} sn`} size="small" />
          )}
        </Stack>

        <Stack spacing={1}>
          {answer.options.map((option) => {
            let optionBg = 'transparent'
            if (option.isCorrect) {
              optionBg = 'rgba(34,197,94,0.12)'
            } else if (option.isSelected) {
              optionBg = 'rgba(248,113,113,0.12)'
            }

            return (
              <Box
                key={option.id}
                sx={{
                  bgcolor: optionBg,
                  border: option.isCorrect || option.isSelected ? '1px solid' : '1px solid rgba(148,163,184,0.25)',
                  borderColor: option.isCorrect ? 'success.main' : option.isSelected ? 'error.main' : 'divider',
                  borderRadius: 2,
                  px: 1.5,
                  py: 1,
                }}
              >
                <Typography variant="body2">
                  <strong>{option.label}.</strong> {option.text}
                  {option.isCorrect && ' ✓ Doğru cevap'}
                  {option.isSelected && !option.isCorrect && ' · Senin cevabın'}
                </Typography>
              </Box>
            )
          })}
        </Stack>
      </Box>

      {answer.explanation && (
        <Accordion
          disableGutters
          elevation={0}
          expanded={expanded}
          onChange={(_, isExpanded) => setExpanded(answer.questionId, isExpanded)}
          sx={{ bgcolor: 'transparent', '&::before': { display: 'none' } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreOutlinedIcon />}>
            <Typography sx={{ fontWeight: 700 }} variant="body2">
              Açıklama ve çözüm mantığı
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <Typography sx={{ whiteSpace: 'pre-line' }} variant="body2">
              {answer.explanation.explanation}
            </Typography>
            {answer.explanation.solutionNote && (
              <Typography color="text.secondary" sx={{ mt: 1.5, whiteSpace: 'pre-line' }} variant="body2">
                <strong>Çözüm notu:</strong> {answer.explanation.solutionNote}
              </Typography>
            )}
          </AccordionDetails>
        </Accordion>
      )}
    </Box>
  )
}

export const QuestionSolutionCard = memo(QuestionSolutionCardComponent)
