import { Box, Typography } from '@mui/material'

interface PageHeaderProps {
  title: string
  description: string
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography component="h1" variant="h1">
        {title}
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 760 }}>
        {description}
      </Typography>
    </Box>
  )
}
