import { useEffect, useState } from 'react'
import { Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Paper, Stack, Typography } from '@mui/material'
import { api } from '../../shared/api'
import type { CookieConsent } from '../../models'

const STORAGE_KEY = 'cookieConsent'
const VERSION = 'v1'

function readConsent(): CookieConsent | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) as CookieConsent : null
  } catch {
    return null
  }
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false)
  const [preferencesOpen, setPreferencesOpen] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)

  useEffect(() => {
    const existing = readConsent()
    if (!existing || existing.version !== VERSION) {
      setVisible(true)
    }
  }, [])

  async function saveConsent(consent: CookieConsent) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(consent))
    setVisible(false)
    setPreferencesOpen(false)
    try {
      await api.saveCookieConsent(consent)
    } catch {
      // Local preference remains authoritative for the client even if logging fails.
    }
  }

  if (!visible) {
    return null
  }

  return (
    <>
      <Paper
        elevation={8}
        sx={{
          borderRadius: 2,
          bottom: 18,
          left: { md: 24, xs: 12 },
          maxWidth: 620,
          p: 2,
          position: 'fixed',
          right: { xs: 12, md: 'auto' },
          zIndex: 1500,
        }}
      >
        <Stack direction={{ md: 'row', xs: 'column' }} spacing={1.5} sx={{ alignItems: { md: 'center', xs: 'stretch' } }}>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 850 }}>Çerez tercihleri</Typography>
            <Typography color="text.secondary" variant="body2">
              Bu web sitesi deneyiminizi geliştirmek için çerezler kullanmaktadır.
            </Typography>
          </Box>
          <Button onClick={() => saveConsent({ necessary: true, analytics: true, marketing: true, version: VERSION })} variant="contained">
            Tümünü Kabul Et
          </Button>
          <Button onClick={() => setPreferencesOpen(true)} variant="outlined">
            Tercihleri Yönet
          </Button>
          <Button onClick={() => saveConsent({ necessary: true, analytics: false, marketing: false, version: VERSION })}>
            Reddet
          </Button>
        </Stack>
      </Paper>

      <Dialog fullWidth maxWidth="xs" open={preferencesOpen} onClose={() => setPreferencesOpen(false)}>
        <DialogTitle>Çerez tercihleri</DialogTitle>
        <DialogContent>
          <Stack spacing={1}>
            <FormControlLabel control={<Checkbox checked disabled />} label="Zorunlu Çerezler" />
            <FormControlLabel control={<Checkbox checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} />} label="Analitik Çerezler" />
            <FormControlLabel control={<Checkbox checked={marketing} onChange={(event) => setMarketing(event.target.checked)} />} label="Pazarlama Çerezleri" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreferencesOpen(false)}>Vazgeç</Button>
          <Button onClick={() => saveConsent({ necessary: true, analytics, marketing, version: VERSION })} variant="contained">
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
