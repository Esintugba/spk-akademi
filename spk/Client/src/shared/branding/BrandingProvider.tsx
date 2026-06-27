import type { ReactNode } from 'react'
import { branding } from '../config/branding'
import { BrandingContext } from './BrandingContext'

export function BrandingProvider({ children }: { children: ReactNode }) {
  return <BrandingContext.Provider value={branding}>{children}</BrandingContext.Provider>
}
