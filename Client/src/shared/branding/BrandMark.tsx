import { Box, Typography } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import { Link as RouterLink } from 'react-router'
import { useBranding } from './useBranding'

interface BrandMarkProps {
  ariaLabel?: string
  subtitle?: string
  to?: string
  variant?: 'light' | 'dark'
  sx?: SxProps<Theme>
}

export function BrandMark({ ariaLabel, subtitle, to, variant = 'dark', sx }: BrandMarkProps) {
  const { appName, shortName } = useBranding()
  const isLight = variant === 'light'

  const content = (
    <>
      <Box
        aria-hidden
        sx={{
          alignItems: 'center',
          background: isLight
            ? 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)'
            : 'linear-gradient(135deg, #0f766e 0%, #1d4ed8 100%)',
          borderRadius: 2,
          color: '#fff',
          display: 'flex',
          fontSize: 12,
          fontWeight: 800,
          height: 42,
          justifyContent: 'center',
          flex: '0 0 auto',
          width: 42,
        }}
      >
        SPK
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          noWrap
          sx={{
            color: isLight ? '#f8fafc' : 'text.primary',
            fontSize: 18,
            fontWeight: 800,
            lineHeight: 1,
          }}
        >
          {appName}
        </Typography>
        {subtitle && (
          <Typography
            noWrap
            sx={{
              color: isLight ? '#94a3b8' : 'text.secondary',
              fontSize: 12,
              mt: 0.25,
            }}
            variant="caption"
          >
            {subtitle}
          </Typography>
        )}
        {!subtitle && shortName !== appName && (
          <Typography color="text.secondary" variant="caption">
          {shortName}
        </Typography>
      )}
      </Box>
    </>
  )

  const rootSx = [
    {
      alignItems: 'center',
      color: 'inherit',
      display: 'flex',
      gap: 1.5,
      minWidth: 0,
      textDecoration: 'none',
    },
    to
      ? {
          cursor: 'pointer',
          '&:focus-visible': {
            borderRadius: 2,
            outline: '3px solid rgba(37,99,235,0.35)',
            outlineOffset: 4,
          },
        }
      : null,
    ...(Array.isArray(sx) ? sx : [sx]),
  ]

  if (to) {
    return (
      <Box aria-label={ariaLabel ?? appName} component={RouterLink} sx={rootSx} to={to}>
        {content}
      </Box>
    )
  }

  return (
    <Box sx={rootSx}>
      {content}
    </Box>
  )
}
