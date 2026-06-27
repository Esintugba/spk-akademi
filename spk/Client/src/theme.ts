import { createTheme } from '@mui/material/styles'
import type { PaletteMode } from '@mui/material'

export function createAppTheme(mode: PaletteMode, compactView = false) {
  const isDark = mode === 'dark'

  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? '#2dd4bf' : '#0f766e',
        contrastText: isDark ? '#042f2e' : '#ffffff',
      },
      secondary: {
        main: isDark ? '#60a5fa' : '#2563eb',
      },
      background: {
        default: isDark ? '#0f172a' : '#f5f7fa',
        paper: isDark ? '#111827' : '#ffffff',
      },
      text: {
        primary: isDark ? '#e5eefb' : '#17202a',
        secondary: isDark ? '#94a3b8' : '#64748b',
      },
      divider: isDark ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.22)',
    },
    shape: {
      borderRadius: 8,
    },
    typography: {
      fontFamily: [
        'Roboto',
        'Inter',
        'system-ui',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'sans-serif',
      ].join(','),
      h1: {
        fontSize: '2rem',
        fontWeight: 700,
        letterSpacing: 0,
      },
      h2: {
        fontSize: '1.2rem',
        fontWeight: 700,
        letterSpacing: 0,
      },
      button: {
        fontWeight: 700,
        textTransform: 'none',
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            whiteSpace: 'nowrap',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiContainer: {
        defaultProps: {
          maxWidth: compactView ? 'md' : 'lg',
        },
      },
      MuiTextField: {
        defaultProps: {
          size: compactView ? 'small' : 'medium',
        },
        styleOverrides: {
          root: {
            minWidth: 0,
          },
        },
      },
      MuiFormControl: {
        styleOverrides: {
          root: {
            minWidth: 0,
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            minWidth: 0,
          },
          input: {
            minWidth: 0,
            textOverflow: 'ellipsis',
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            minWidth: 0,
            '& textarea': {
              boxSizing: 'border-box',
              overflow: 'auto !important',
              resize: 'none',
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          select: {
            display: 'block',
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          },
        },
      },
      MuiButtonBase: {
        defaultProps: {
          disableRipple: compactView,
        },
      },
    },
  })
}
