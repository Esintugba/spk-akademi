import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import { Box, Button, Paper, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router'

interface AccessDeniedProps {
  title?: string
  message?: string
}

export function AccessDenied({
  title = 'Erişim reddedildi',
  message = 'Bu denemeye erişim hakkınız bulunmuyor. Lisans veya satın alma ile erişim sağlayabilirsiniz.',
}: AccessDeniedProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid rgba(248,113,113,0.35)',
        borderRadius: 3,
        p: { md: 5, xs: 3 },
        textAlign: 'center',
      }}
    >
      <Stack spacing={2} sx={{ alignItems: 'center' }}>
        <Box
          sx={{
            alignItems: 'center',
            bgcolor: 'rgba(248,113,113,0.12)',
            borderRadius: '50%',
            color: 'error.main',
            display: 'flex',
            height: 64,
            justifyContent: 'center',
            width: 64,
          }}
        >
          <LockOutlinedIcon fontSize="large" />
        </Box>
        <Typography variant="h5">{title}</Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 480 }}>
          {message}
        </Typography>
        <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1.5}>
          <Button component={RouterLink} to="/plans" variant="contained">
            Paketleri İncele
          </Button>
          <Button component={RouterLink} to="/my-trials" variant="outlined">
            Denemelerime Dön
          </Button>
        </Stack>
      </Stack>
    </Paper>
  )
}
