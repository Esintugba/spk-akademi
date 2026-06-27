import type { ReactNode } from 'react'
import { Box, Paper, Stack, Typography } from '@mui/material'

interface AdminMetricCardProps {
  label: string
  value: string | number
  detail: string
  icon: ReactNode
}

export function AdminMetricCard({ label, value, detail, icon }: AdminMetricCardProps) {
  return (
    <Paper
      sx={{
        borderRadius: 4,
        p: 2.5,
      }}
      variant="outlined"
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography color="text.secondary" sx={{ fontSize: 13, fontWeight: 700 }}>
            {label}
          </Typography>
          <Typography sx={{ fontSize: 30, fontWeight: 900, mt: 1 }}>{value}</Typography>
          <Typography color="text.secondary" sx={{ fontSize: 12, mt: 1.25 }}>
            {detail}
          </Typography>
        </Box>
        <Box
          sx={{
            alignItems: 'center',
            bgcolor: 'rgba(37,99,235,0.08)',
            borderRadius: 3,
            color: '#1d4ed8',
            display: 'flex',
            height: 48,
            justifyContent: 'center',
            width: 48,
          }}
        >
          {icon}
        </Box>
      </Stack>
    </Paper>
  )
}
