export const marketingPageSx = {
  pb: { md: 8, xs: 5 },
} as const

export const marketingSectionSx = {
  mt: { md: 7, xs: 4 },
} as const

export const marketingCardSx = {
  borderRadius: 2,
  height: '100%',
  p: { md: 3, xs: 2.5 },
  transition: 'border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease',
  '&:hover': {
    borderColor: 'rgba(15,118,110,0.38)',
    boxShadow: '0 18px 44px rgba(15,23,42,0.08)',
    transform: 'translateY(-2px)',
  },
} as const

export const marketingCompactCardSx = {
  borderRadius: 2,
  p: { md: 2.5, xs: 2 },
} as const

export const marketingGridSx = {
  display: 'grid',
  gap: 2,
  gridTemplateColumns: { lg: 'repeat(3, minmax(0, 1fr))', sm: 'repeat(2, minmax(0, 1fr))', xs: '1fr' },
} as const

export const marketingTwoColumnSx = {
  alignItems: 'start',
  display: 'grid',
  gap: { md: 3, xs: 2 },
  gridTemplateColumns: { lg: 'minmax(0, 1fr) 360px', xs: '1fr' },
} as const

export const iconTileSx = {
  alignItems: 'center',
  bgcolor: 'rgba(15,118,110,0.08)',
  borderRadius: 2,
  color: 'primary.main',
  display: 'inline-flex',
  height: 44,
  justifyContent: 'center',
  width: 44,
  '& svg': {
    fontSize: 24,
  },
} as const
