import type { ReactNode } from 'react'
import { Paper, Stack, Typography } from '@mui/material'

interface AdminSurfaceProps {
  title?: string
  description?: string
  children: ReactNode
}

export function AdminSurface({ title, description, children }: AdminSurfaceProps) {
  return (
    <Paper
      sx={{
        borderRadius: 4,
        minWidth: 0,
        p: { md: 3, xs: 2.25 },
      }}
      variant="outlined"
    >
      {(title || description) && (
        <Stack spacing={0.5} sx={{ mb: 2.5 }}>
          {title && <Typography sx={{ fontSize: 20, fontWeight: 900 }}>{title}</Typography>}
          {description && (
            <Typography color="text.secondary" sx={{ lineHeight: 1.75 }} variant="body2">
              {description}
            </Typography>
          )}
        </Stack>
      )}
      {children}
    </Paper>
  )
}
