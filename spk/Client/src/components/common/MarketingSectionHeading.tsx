import { Stack, Typography } from '@mui/material'

export function MarketingSectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string
  title: string
  description?: string
}) {
  return (
    <Stack spacing={1} sx={{ mb: 2.5, maxWidth: 820 }}>
      {eyebrow && (
        <Typography color="primary.main" sx={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase' }}>
          {eyebrow}
        </Typography>
      )}
      <Typography sx={{ fontSize: { md: 32, xs: 26 }, fontWeight: 900, lineHeight: 1.15 }}>
        {title}
      </Typography>
      {description && (
        <Typography color="text.secondary" sx={{ lineHeight: 1.8, maxWidth: 760 }}>
          {description}
        </Typography>
      )}
    </Stack>
  )
}
