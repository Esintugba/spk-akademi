import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined'
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined'
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined'
import { Box, Chip, Paper, Stack, Typography } from '@mui/material'
import { useBranding } from '../../shared/branding/useBranding'
import { useLocalization } from '../../shared/localization'

const items = [
  {
    icon: <TimelineOutlinedIcon fontSize="small" />,
    title: 'İlerleme takibi',
    description: 'Konu, test ve tekrar ritmini aynı panelde görün.',
  },
  {
    icon: <ShieldOutlinedIcon fontSize="small" />,
    title: 'Güvenli hesap',
    description: 'JWT, rol tabanlı erişim ve oturum yönetimi hazır.',
  },
  {
    icon: <WorkspacePremiumOutlinedIcon fontSize="small" />,
    title: 'Lisans bazlı çalışma',
    description: 'Erişimin olan lisanslara göre kişiselleşen deneyim.',
  },
]

export function AuthShowcase({ title, description }: { title: string; description: string }) {
  const { appName } = useBranding()
  const { t } = useLocalization()

  return (
    <Paper
      sx={{
        borderRadius: 5,
        overflow: 'hidden',
        p: { md: 4, xs: 3 },
        position: 'relative',
      }}
      variant="outlined"
    >
      <Box
        sx={{
          background:
            'radial-gradient(circle at top right, rgba(37,99,235,0.14), transparent 35%), radial-gradient(circle at bottom left, rgba(20,184,166,0.12), transparent 36%)',
          inset: 0,
          position: 'absolute',
        }}
      />
      <Stack spacing={2.5} sx={{ position: 'relative' }}>
        <Chip
          label={appName}
          sx={{
            alignSelf: 'flex-start',
            bgcolor: 'rgba(37,99,235,0.08)',
            color: 'primary.main',
            fontWeight: 700,
          }}
        />
        <Typography sx={{ fontSize: { md: 34, xs: 28 }, fontWeight: 900, lineHeight: 1.08 }}>
          {t(title)}
        </Typography>
        <Typography color="text.secondary" sx={{ lineHeight: 1.85 }}>
          {t(description)}
        </Typography>
        <Stack spacing={1.5}>
          {items.map((item) => (
            <Stack
              direction="row"
              key={item.title}
              spacing={1.5}
              sx={{
                alignItems: 'flex-start',
                border: '1px solid rgba(148,163,184,0.16)',
                borderRadius: 3,
                p: 2,
              }}
            >
              <Box
                sx={{
                  alignItems: 'center',
                  bgcolor: 'rgba(37,99,235,0.08)',
                  borderRadius: 2,
                  color: 'primary.main',
                  display: 'flex',
                  height: 36,
                  justifyContent: 'center',
                  width: 36,
                }}
              >
                {item.icon}
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 800 }}>{t(item.title)}</Typography>
                <Typography color="text.secondary" sx={{ fontSize: 14, mt: 0.5 }}>
                  {t(item.description)}
                </Typography>
              </Box>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Paper>
  )
}
