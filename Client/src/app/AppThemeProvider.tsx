import { useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'
import { CssBaseline, GlobalStyles, ThemeProvider, useMediaQuery } from '@mui/material'
import type { PaletteMode } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { selectIsAuthenticated } from './authSlice'
import { useAppSelector } from './hooks'
import { UserLanguagePreference, UserThemePreference } from '../models'
import { settingsApi } from '../shared/api'
import { LocalizationProvider } from '../shared/localization'
import { createAppTheme } from '../theme'

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')
  const settingsQuery = useQuery({
    enabled: isAuthenticated,
    queryKey: ['settings'],
    queryFn: settingsApi.get,
    staleTime: 300_000,
  })

  const mode = resolveMode(settingsQuery.data?.theme, prefersDark)
  const compactView = settingsQuery.data?.compactView ?? false
  const theme = useMemo(() => createAppTheme(mode, compactView), [compactView, mode])

  useEffect(() => {
    document.documentElement.lang = settingsQuery.data?.language === UserLanguagePreference.English ? 'en' : 'tr'
    document.documentElement.dataset.theme = mode
    document.documentElement.dataset.compact = compactView ? 'true' : 'false'
    document.documentElement.dataset.dateFormat = String(settingsQuery.data?.dateFormat ?? '')
    document.documentElement.dataset.timeFormat = String(settingsQuery.data?.timeFormat ?? '')
  }, [compactView, mode, settingsQuery.data?.dateFormat, settingsQuery.data?.language, settingsQuery.data?.timeFormat])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles
        styles={{
          html: {
            backgroundColor: theme.palette.background.default,
            colorScheme: mode,
          },
          body: {
            backgroundColor: theme.palette.background.default,
          },
        }}
      />
      <LocalizationProvider settings={settingsQuery.data}>{children}</LocalizationProvider>
    </ThemeProvider>
  )
}

function resolveMode(themePreference: UserThemePreference | undefined, prefersDark: boolean): PaletteMode {
  if (themePreference === UserThemePreference.Dark) {
    return 'dark'
  }

  if (themePreference === UserThemePreference.System) {
    return prefersDark ? 'dark' : 'light'
  }

  return 'light'
}
