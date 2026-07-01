import TranslateOutlinedIcon from '@mui/icons-material/TranslateOutlined'
import { Button, Stack } from '@mui/material'
import { UserLanguagePreference } from '../../models'
import { useLocalization } from '../../shared/localization'

export function LanguageSwitch({ fullWidth = false }: { fullWidth?: boolean }) {
  const { language, setLanguage, t } = useLocalization()

  return (
    <Stack
      aria-label={t('Dil')}
      direction="row"
      role="group"
      spacing={0.5}
      sx={{
        alignItems: 'center',
        border: '1px solid rgba(15,118,110,0.18)',
        borderRadius: 2,
        flexShrink: 0,
        justifyContent: fullWidth ? 'space-between' : 'center',
        p: 0.35,
        width: fullWidth ? '100%' : 'auto',
      }}
    >
      <TranslateOutlinedIcon color="primary" fontSize="small" sx={{ ml: 0.5 }} />
      {[
        { label: 'TR', value: UserLanguagePreference.Turkish },
        { label: 'EN', value: UserLanguagePreference.English },
      ].map((option) => (
        <Button
          aria-pressed={language === option.value}
          key={option.value}
          onClick={() => setLanguage(option.value)}
          size="small"
          sx={{ minWidth: 38, px: 1 }}
          variant={language === option.value ? 'contained' : 'text'}
        >
          {option.label}
        </Button>
      ))}
    </Stack>
  )
}
