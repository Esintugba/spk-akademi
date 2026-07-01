import MilitaryTechOutlinedIcon from '@mui/icons-material/MilitaryTechOutlined'
import NorthEastOutlinedIcon from '@mui/icons-material/NorthEastOutlined'
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined'
import { Dialog, DialogContent, Stack, Typography } from '@mui/material'
import { keyframes } from '@mui/system'
import { useEffect } from 'react'
import { useGamificationStore } from '../../stores/gamificationStore'

const pulseIn = keyframes`
  0% { opacity: 0; transform: translateY(20px) scale(0.94); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
`

export function AchievementCelebrationLayer() {
  const notices = useGamificationStore((state) => state.notices)
  const dismissNotice = useGamificationStore((state) => state.dismissNotice)
  const activeNotice = notices[0]

  useEffect(() => {
    if (!activeNotice) {
      return
    }

    const timeout = window.setTimeout(() => {
      dismissNotice(activeNotice.id)
    }, 3500)

    return () => window.clearTimeout(timeout)
  }, [activeNotice, dismissNotice])

  return (
    <Dialog
      open={Boolean(activeNotice)}
      slotProps={{
        backdrop: { sx: { backgroundColor: 'rgba(15,23,42,0.16)' } },
        paper: {
          sx: {
            animation: `${pulseIn} 220ms ease`,
            background: 'linear-gradient(145deg, rgba(15,118,110,0.98) 0%, rgba(37,99,235,0.96) 100%)',
            borderRadius: 3,
            color: '#f8fafc',
            maxWidth: 420,
            overflow: 'hidden',
            width: 'calc(100% - 32px)',
          },
        },
      }}
    >
      {activeNotice && (
        <DialogContent sx={{ p: 3 }}>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <CelebrationIcon type={activeNotice.type} />
            <Stack spacing={0.5}>
              <Typography sx={{ fontSize: 24, fontWeight: 900 }}>{activeNotice.title}</Typography>
              <Typography sx={{ color: 'rgba(248,250,252,0.84)', lineHeight: 1.7 }}>
                {activeNotice.description}
              </Typography>
            </Stack>
          </Stack>
        </DialogContent>
      )}
    </Dialog>
  )
}

function CelebrationIcon({ type }: { type: 'badge' | 'level' | 'task' }) {
  if (type === 'badge') {
    return <MilitaryTechOutlinedIcon sx={{ color: '#fde68a', fontSize: 38 }} />
  }

  if (type === 'task') {
    return <TaskAltOutlinedIcon sx={{ color: '#bbf7d0', fontSize: 38 }} />
  }

  return <NorthEastOutlinedIcon sx={{ color: '#bfdbfe', fontSize: 38 }} />
}
