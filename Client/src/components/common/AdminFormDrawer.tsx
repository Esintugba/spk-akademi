import type { ReactNode } from 'react'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { Box, Drawer, IconButton, Stack, Typography } from '@mui/material'

interface AdminFormDrawerProps {
  children: ReactNode
  description?: string
  onClose: () => void
  open: boolean
  title: string
}

export function AdminFormDrawer({ children, description, onClose, open, title }: AdminFormDrawerProps) {
  return (
    <Drawer
      anchor="right"
      open={open}
      slotProps={{
        paper: {
          sx: {
            maxWidth: '100%',
            width: { md: 560, xs: '100%' },
          },
        },
      }}
      onClose={onClose}
    >
      <Stack sx={{ height: '100%', minWidth: 0 }}>
        <Stack
          direction="row"
          spacing={2}
          sx={{
            alignItems: 'flex-start',
            borderBottom: '1px solid',
            borderColor: 'divider',
            flex: '0 0 auto',
            justifyContent: 'space-between',
            px: { md: 3, xs: 2.25 },
            py: 2.25,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 20, fontWeight: 900, overflowWrap: 'anywhere' }}>{title}</Typography>
            {description && (
              <Typography color="text.secondary" sx={{ lineHeight: 1.6, mt: 0.5 }} variant="body2">
                {description}
              </Typography>
            )}
          </Box>
          <IconButton aria-label="Kapat" edge="end" onClick={onClose}>
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
        <Box sx={{ flex: '1 1 auto', minHeight: 0, overflowX: 'hidden', overflowY: 'auto', px: { md: 3, xs: 2.25 }, py: 2.5 }}>
          {children}
        </Box>
      </Stack>
    </Drawer>
  )
}
