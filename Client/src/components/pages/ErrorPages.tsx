import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import { Button } from '@mui/material'
import { Link as RouterLink, isRouteErrorResponse, useRouteError } from 'react-router'
import { useLocalization } from '../../shared/localization'
import { ErrorStatePage, LoginAction } from '../common/ErrorStatePage'

export function NotFoundPage() {
  return (
    <ErrorStatePage
      code="404"
      description="Aradığınız sayfa taşınmış, kaldırılmış veya bağlantı hatalı yazılmış olabilir. Ana sayfadan devam edebilir ya da aradığınız lisans, ders veya konuya menüden ulaşabilirsiniz."
      eyebrow="Sayfa bulunamadı"
      title="Bu bağlantı artık geçerli görünmüyor."
      variant="notFound"
    />
  )
}

export function ForbiddenPage() {
  const { t } = useLocalization()

  return (
    <ErrorStatePage
      code="403"
      description="Bu alan için hesabınızda gerekli yetki veya erişim bulunmuyor. Giriş yaptıktan sonra tekrar deneyebilir ya da uygun paket kapsamını inceleyebilirsiniz."
      eyebrow="Erişim sınırı"
      primaryAction={<LoginAction />}
      secondaryAction={
        <Button component={RouterLink} to="/plans" variant="outlined">
          {t('Paketleri incele')}
        </Button>
      }
      title="Bu sayfaya erişim izniniz yok."
      variant="forbidden"
    />
  )
}

export function ServerErrorPage() {
  const { t } = useLocalization()

  return (
    <ErrorStatePage
      code="500"
      description="İstek işlenirken beklenmeyen bir sorun oluştu. Kısa süre sonra tekrar deneyin; sorun devam ederse destek ekibi kayıtları inceleyebilir."
      eyebrow="Sistem hatası"
      primaryAction={
        <Button onClick={() => window.location.reload()} startIcon={<RefreshRoundedIcon />} variant="contained">
          {t('Sayfayı yenile')}
        </Button>
      }
      secondaryAction={
        <Button component={RouterLink} startIcon={<HomeOutlinedIcon />} to="/" variant="outlined">
          {t('Ana sayfa')}
        </Button>
      }
      title="Şu anda bu işlemi tamamlayamadık."
      variant="server"
    />
  )
}

export function DataErrorPage() {
  const { t } = useLocalization()

  return (
    <ErrorStatePage
      description="Bu ekran için gerekli veriler alınamadı. Bağlantı veya oturum sürenizle ilgili geçici bir problem olabilir."
      eyebrow="Veri yüklenemedi"
      primaryAction={
        <Button onClick={() => window.location.reload()} startIcon={<RefreshRoundedIcon />} variant="contained">
          {t('Tekrar dene')}
        </Button>
      }
      title="Sayfa verileri yüklenemedi."
      variant="data"
    />
  )
}

export function RouteErrorPage() {
  const error = useRouteError()
  const { t } = useLocalization()

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) return <NotFoundPage />
    if (error.status === 401 || error.status === 403) return <ForbiddenPage />
    if (error.status >= 500) return <ServerErrorPage />
  }

  const message = error instanceof Error ? error.message : undefined

  return (
    <ErrorStatePage
      description="Beklenmeyen bir hata oluştu. Sayfayı yenilemek çoğu geçici problemi çözer; devam ederse destek ekibine ekran bilgisini iletebilirsiniz."
      details={message}
      eyebrow="Beklenmeyen hata"
      primaryAction={
        <Button onClick={() => window.location.reload()} startIcon={<RefreshRoundedIcon />} variant="contained">
          {t('Sayfayı yenile')}
        </Button>
      }
      title="Bir şey yolunda gitmedi."
      variant="generic"
    />
  )
}
