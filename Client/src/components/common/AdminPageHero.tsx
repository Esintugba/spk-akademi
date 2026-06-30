import type { ReactNode } from 'react'
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined'
import { Box, Chip, Stack, Typography } from '@mui/material'

interface AdminPageHeroProps {
  title: string
  description: string
  eyebrow?: string
  actions?: ReactNode
  sideContent?: ReactNode
}

export function AdminPageHero({
  title,
  description,
  eyebrow = 'Admin Paneli',
  actions,
  sideContent,
}: AdminPageHeroProps) {
  return (
    <Box
      sx={{
        border: '1px solid rgba(148,163,184,0.18)',
        borderRadius: { md: 5, xs: 3 },
        overflow: 'hidden',
        p: { md: 4, xs: 2 },
        position: 'relative',
        width: '100%',
      }}
    >
      <Box
        sx={{
          background:
            'radial-gradient(circle at top right, rgba(59,130,246,0.14), transparent 34%), radial-gradient(circle at bottom left, rgba(99,102,241,0.12), transparent 36%)',
          inset: 0,
          position: 'absolute',
        }}
      />
      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: sideContent ? { lg: '1.2fr 0.8fr', xs: '1fr' } : '1fr',
          minWidth: 0,
          position: 'relative',
        }}
      >
        <Stack spacing={2} sx={{ minWidth: 0 }}>
          <Chip
            icon={<AutoAwesomeOutlinedIcon />}
            label={eyebrow}
            sx={{
              alignSelf: 'flex-start',
              bgcolor: 'rgba(37,99,235,0.08)',
              color: '#1d4ed8',
              fontWeight: 700,
              maxWidth: '100%',
              '& .MuiChip-label': { overflowWrap: 'anywhere', whiteSpace: 'normal' },
            }}
          />
          <Typography component="h1" sx={{ fontSize: { md: 40, xs: 28 }, fontWeight: 900, lineHeight: 1.1 }}>
            {title}
          </Typography>
          <Typography color="text.secondary" sx={{ lineHeight: 1.85, maxWidth: 760 }}>
            {description}
          </Typography>
          {actions && (
            <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1.5} sx={{ '& .MuiButton-root': { minWidth: 0, width: { sm: 'auto', xs: '100%' } } }}>
              {actions}
            </Stack>
          )}
        </Stack>
        {sideContent && <Box sx={{ minWidth: 0 }}>{sideContent}</Box>}
      </Box>
    </Box>
  )
}
