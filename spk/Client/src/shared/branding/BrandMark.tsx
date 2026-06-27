import { Box, Typography } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import { useBranding } from './useBranding'

interface BrandMarkProps {
  subtitle?: string
  variant?: 'light' | 'dark'
  sx?: SxProps<Theme>
}

export function BrandMark({ subtitle, variant = 'dark', sx }: BrandMarkProps) {
  const { appName, shortName } = useBranding()
  const isLight = variant === 'light'

  return (
    <Box sx={[{ display: 'flex', alignItems: 'center', gap: 1.5 }, ...(Array.isArray(sx) ? sx : [sx])]}>
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
          width: 42,
        }}
      >
        SPK
      </Box>
      <Box>
        <Typography
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
    </Box>
  )
}
