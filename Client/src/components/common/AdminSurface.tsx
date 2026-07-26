import type { ReactNode } from 'react'
import { Paper, Stack, Typography } from '@mui/material'

interface AdminSurfaceProps {
  title?: string
  description?: string
  headerActions?: ReactNode
  children: ReactNode
}

export function AdminSurface({ title, description, headerActions, children }: AdminSurfaceProps) {
  return (
    <Paper
      sx={{
        borderRadius: 4,
        minWidth: 0,
        p: { md: 3, xs: 2.25 },
      }}
      variant="outlined"
    >
      {(title || description || headerActions) && (
        <Stack
          direction={{ sm: 'row', xs: 'column' }}
          spacing={1.5}
          sx={{ alignItems: { sm: 'flex-start', xs: 'stretch' }, justifyContent: 'space-between', mb: 2.5 }}
        >
          <Stack spacing={0.5}>
            {title && <Typography sx={{ fontSize: 20, fontWeight: 900 }}>{title}</Typography>}
            {description && (
              <Typography color="text.secondary" sx={{ lineHeight: 1.75 }} variant="body2">
                {description}
              </Typography>
            )}
          </Stack>
          {headerActions}
        </Stack>
      )}
      {children}
    </Paper>
  )
}
