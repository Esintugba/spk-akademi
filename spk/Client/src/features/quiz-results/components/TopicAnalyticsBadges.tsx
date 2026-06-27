import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined'
import TrendingDownOutlinedIcon from '@mui/icons-material/TrendingDownOutlined'
import { Chip, Paper, Stack, Typography } from '@mui/material'
import type { QuizResultAnalytics } from '../../../models/quizResult'

interface TopicAnalyticsBadgesProps {
  analytics: QuizResultAnalytics
}

export function TopicAnalyticsBadges({ analytics }: TopicAnalyticsBadgesProps) {
  if (analytics.strongTopics.length === 0 && analytics.weakTopics.length === 0) {
    return null
  }

  return (
    <Paper sx={{ borderRadius: 3, p: 2.5 }} variant="outlined">
      <Stack spacing={2}>
        {analytics.strongTopics.length > 0 && (
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <EmojiEventsOutlinedIcon color="success" fontSize="small" />
              <Typography sx={{ fontWeight: 800 }} variant="subtitle2">
                Güçlü konular
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
              {analytics.strongTopics.map((topic) => (
                <Chip
                  color="success"
                  key={topic.topicId}
                  label={`${topic.lessonName} · ${topic.topicName} (%${topic.successRate})`}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Stack>
          </Stack>
        )}

        {analytics.weakTopics.length > 0 && (
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <TrendingDownOutlinedIcon color="warning" fontSize="small" />
              <Typography sx={{ fontWeight: 800 }} variant="subtitle2">
                Riskli alt konular
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
              {analytics.weakTopics.map((topic) => (
                <Chip
                  color="warning"
                  key={topic.topicId}
                  label={`${topic.lessonName} · ${topic.topicName} (%${topic.successRate})`}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Stack>
          </Stack>
        )}

        {(analytics.fastestQuestion || analytics.slowestQuestion) && (
          <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1}>
            {analytics.fastestQuestion && (
              <Typography color="text.secondary" variant="caption">
                En hızlı: {analytics.fastestQuestion.timeSpentSeconds} sn
              </Typography>
            )}
            {analytics.slowestQuestion && (
              <Typography color="text.secondary" variant="caption">
                En yavaş: {analytics.slowestQuestion.timeSpentSeconds} sn
              </Typography>
            )}
          </Stack>
        )}
      </Stack>
    </Paper>
  )
}
