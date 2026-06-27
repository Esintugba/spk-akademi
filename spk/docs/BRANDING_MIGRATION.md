# SPK Akademi — Marka Geçişi (FinLisans → SPK Akademi)

## Özet

Tüm kullanıcı yüzeyleri tek marka altında birleştirildi: **SPK Akademi**. FinLisans ve türevleri kaldırıldı; marka bilgisi merkezi yapılandırmadan okunur.

## Tespit edilen FinLisans kullanımları

| Konum | Durum |
|--------|--------|
| `Client/src/components/layout/StudentLayout.tsx` | `BrandMark` ile değiştirildi |
| `Client/src/components/pages/LandingPage.tsx` | Metin güncellendi |

Backend ve diğer dosyalarda FinLisans eşleşmesi yoktu.

## Merkezi branding yapısı

```
Client/src/shared/
  config/branding.ts          # appName, SEO, route titles, buildPageTitle
  branding/
    BrandingContext.tsx       # React provider
    BrandMark.tsx             # Logo + isim bileşeni
    DocumentTitleManager.tsx  # Dinamik title + meta/OG
    AppBrandingShell.tsx      # Router kök sarmalayıcı
```

```ts
// Client/src/shared/config/branding.ts
export const branding = {
  appName: 'SPK Akademi',
  supportEmail: 'destek@spkakademi.com',
  // ...
}
```

Backend:

```
API/Configuration/BrandingOptions.cs
API/appsettings.json → "Branding" bölümü
```

## Sayfa başlığı formatı

- Varsayılan: `SPK Akademi - SPK Lisanslama Hazırlık Platformu`
- Panel sayfaları: `SPK Akademi | Panelim`, `SPK Akademi | Denemelerim`, vb.
- Pazarlama rotaları: `router.tsx` içindeki `handle.seo.title` + `DocumentTitleManager`

## Search / replace stratejisi

```powershell
# Doğrulama (node_modules hariç)
rg -i "finlisans|fin-lisans|fin_lisans" --glob "!**/node_modules/**"
```

Yeni hardcoded marka eklemeyin; `useBranding()`, `BrandMark` veya `branding` config kullanın.

## Asset migration

| Dosya | Açıklama |
|--------|----------|
| `Client/public/favicon.svg` | SPK temalı SVG |
| `Client/public/manifest.webmanifest` | PWA adı / açıklama |
| `Client/public/social-preview.svg` | OG görseli |
| `Client/index.html` | İlk yükleme meta + manifest link |

İsteğe bağlı: `favicon.ico`, `apple-touch-icon.png` — SVG yeterli değilse aynı tasarımla üretin ve `index.html`e ekleyin.

## Production migration checklist

- [ ] `rg -i finlisans` → 0 sonuç
- [ ] `npm run build` (Client) başarılı
- [ ] `dotnet build` (API) başarılı
- [ ] Swagger UI başlığı: **SPK Akademi API**
- [ ] E-posta gönderen adı: **SPK Akademi** (`Email:FromName`)
- [ ] Canlıda tarayıcı sekmesi ve OG meta doğrulandı
- [ ] CDN / reverse proxy önbelleği temizlendi (`favicon`, `manifest`, `social-preview`)
- [ ] Eski domain veya e-posta yönlendirmeleri güncellendi (varsa)

## Best practices

1. **Tek kaynak:** Marka metni yalnızca `branding.ts` ve `BrandingOptions` içinde.
2. **UI:** Navbar/sidebar/footer için `BrandMark` + `useBranding()`.
3. **SEO:** Yeni public route eklerken `handle.seo` tanımlayın; panel route için `appRouteTitles` güncelleyin.
4. **E-posta:** Konu satırında `[SPK Akademi]` öneki; gövdede ortak `Footer` sabiti.
5. **Ortam:** Production `appsettings` içinde `Branding` ve `Email` bölümlerini override edin.

## Klasör önerisi (gelecek)

```
shared/config/branding.ts
shared/branding/          # React-only
features/*/               # İş mantığı; marka içermez
```
