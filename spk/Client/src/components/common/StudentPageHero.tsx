import type { ReactNode } from 'react'
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined'
import { Box, Chip, Stack, Typography } from '@mui/material'

interface StudentPageHeroProps {
  title: string
  description: string
  eyebrow?: string
  actions?: ReactNode
  sideContent?: ReactNode
}

export function StudentPageHero({
  title,
  description,
  eyebrow = 'Öğrenci Paneli',
  actions,
  sideContent,
}: StudentPageHeroProps) {
  return (
    <Box
      sx={{
        border: '1px solid rgba(148,163,184,0.18)',
        borderRadius: 4,
        overflow: 'hidden',
        p: { md: 4, xs: 3 },
        position: 'relative',
      }}
    >
      <Box
        sx={{
          background:
            'radial-gradient(circle at top right, rgba(37,99,235,0.12), transparent 32%), radial-gradient(circle at bottom left, rgba(20,184,166,0.12), transparent 34%)',
          inset: 0,
          position: 'absolute',
        }}
      />
      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: sideContent ? { lg: '1.2fr 0.8fr', xs: '1fr' } : '1fr',
          position: 'relative',
        }}
      >
        <Stack spacing={2}>
          <Chip
            icon={<AutoAwesomeOutlinedIcon />}
            label={eyebrow}
            sx={{ alignSelf: 'flex-start', bgcolor: 'rgba(15,118,110,0.08)', color: 'primary.main', fontWeight: 700 }}
          />
          <Typography component="h1" sx={{ fontSize: { md: 40, xs: 30 }, fontWeight: 900, lineHeight: 1.08 }}>
            {title}
          </Typography>
          <Typography color="text.secondary" sx={{ lineHeight: 1.85, maxWidth: 760 }}>
            {description}
          </Typography>
          {actions && (
            <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1.5}>
              {actions}
            </Stack>
          )}
        </Stack>
        {sideContent}
      </Box>
    </Box>
  )
}
