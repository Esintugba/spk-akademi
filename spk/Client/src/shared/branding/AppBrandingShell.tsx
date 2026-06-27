import { Outlet } from 'react-router'
import { CookieConsentBanner } from '../../components/common/CookieConsentBanner'
import { BrandingProvider } from './BrandingProvider'
import { DocumentTitleManager } from './DocumentTitleManager'

export function AppBrandingShell() {
  return (
    <BrandingProvider>
      <DocumentTitleManager />
      <Outlet />
      <CookieConsentBanner />
    </BrandingProvider>
  )
}
