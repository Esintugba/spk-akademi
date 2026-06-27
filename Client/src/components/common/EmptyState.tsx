import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { Paper, Stack, Typography } from '@mui/material'

interface EmptyStateProps {
  title: string
  description: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
        <InfoOutlinedIcon color="primary" />
        <div>
          <Typography sx={{ fontWeight: 800 }}>{title}</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {description}
          </Typography>
        </div>
      </Stack>
    </Paper>
  )
}
