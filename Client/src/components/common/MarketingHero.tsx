import type { ReactNode } from 'react'
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined'
import { Box, Chip, Container, Stack, Typography } from '@mui/material'

interface MarketingHeroProps {
  eyebrow: string
  title: string
  description: string
  actions?: ReactNode
  sideContent?: ReactNode
}

export function MarketingHero({
  eyebrow,
  title,
  description,
  actions,
  sideContent,
}: MarketingHeroProps) {
  return (
    <Box component="section" sx={{ px: { md: 3, xs: 2 }, pt: { md: 4, xs: 2.5 } }}>
      <Container maxWidth="xl">
        <Box
          sx={{
            border: '1px solid rgba(148,163,184,0.18)',
            borderRadius: 3,
            overflow: 'hidden',
            p: { md: 5, xs: 2.5 },
            position: 'relative',
          }}
        >
          <Box
            sx={{
              background:
                'radial-gradient(circle at top right, rgba(37,99,235,0.16), transparent 32%), radial-gradient(circle at bottom left, rgba(20,184,166,0.12), transparent 34%)',
              inset: 0,
              position: 'absolute',
            }}
          />
          <Box
            sx={{
              display: 'grid',
              gap: { md: 4, xs: 3 },
              gridTemplateColumns: sideContent ? { lg: 'minmax(0, 1.15fr) minmax(320px, 0.85fr)', xs: '1fr' } : '1fr',
              position: 'relative',
            }}
          >
            <Stack spacing={2.25} sx={{ maxWidth: 840 }}>
              <Chip
                icon={<AutoAwesomeOutlinedIcon />}
                label={eyebrow}
                sx={{
                  alignSelf: 'flex-start',
                  bgcolor: 'rgba(37,99,235,0.08)',
                  color: 'primary.main',
                  fontWeight: 700,
                }}
              />
              <Typography component="h1" sx={{ fontSize: { md: 50, sm: 42, xs: 32 }, fontWeight: 900, lineHeight: 1.08 }}>
                {title}
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: { md: 18, xs: 16 }, lineHeight: 1.9, maxWidth: 760 }}>
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
      </Container>
    </Box>
  )
}
