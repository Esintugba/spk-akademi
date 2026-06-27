import { createContext } from 'react'
import { branding, type Branding } from '../config/branding'

export const BrandingContext = createContext<Branding>(branding)
