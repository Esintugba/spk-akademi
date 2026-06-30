import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined'
import { Alert, Button, Chip, Stack } from '@mui/material'
import { Link as RouterLink } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { onboardingApi } from '../../shared/api'
import { useAccessRequestStore } from '../../stores/accessRequestStore'

export function DashboardAccessBanner() {
  const openAccessRequest = useAccessRequestStore((s) => s.openModal)

  const { data } = useQuery({
    queryKey: ['onboarding', 'status'],
    queryFn: onboardingApi.getStatus,
    staleTime: 60_000,
  })

  if (!data) {
    return null
  }

  if (data.hasFullAccess) {
    return null
  }

  const demo = data.demoPlan
  const isExpired = demo?.isExpired === true

  if (data.hasDemoAccess && !isExpired) {
    return (
      <Alert
        icon={false}
        severity="info"
        sx={{ borderRadius: 3 }}
        action={
          <Stack direction="row" spacing={1}>
            <Chip color="success" label="Demo Erişim" size="small" sx={{ fontWeight: 700 }} />
            <Button
              onClick={() => demo && openAccessRequest({ planId: demo.id, planName: demo.name })}
              size="small"
              variant="outlined"
            >
              Erişim Talep Et
            </Button>
          </Stack>
        }
      >
        {demo?.name} aktif — {demo?.daysRemaining} gün kaldı. Demo limitleri geçerlidir.
      </Alert>
    )
  }

  return (
    <Alert
      severity={isExpired ? 'warning' : 'info'}
      sx={{ borderRadius: 3 }}
      action={
        <Button
          component={RouterLink}
          size="small"
          startIcon={<RocketLaunchOutlinedIcon />}
          to="/plans"
          variant="contained"
        >
          Erişim Talep Et
        </Button>
      }
    >
      <Stack spacing={0.5}>
        <Chip
          color={isExpired ? 'warning' : 'default'}
          label={isExpired ? 'Demo Süresi Doldu' : 'Erişim Bekleniyor'}
          size="small"
          sx={{ alignSelf: 'flex-start', fontWeight: 700 }}
        />
        <span style={{ whiteSpace: 'pre-line' }}>{data.welcomeMessage}</span>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', mt: 0.5 }}>
          <EmailOutlinedIcon fontSize="inherit" />
          <span>{data.supportEmail}</span>
        </Stack>
      </Stack>
    </Alert>
  )
}
