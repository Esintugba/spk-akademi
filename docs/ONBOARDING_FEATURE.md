# Yeni Kullanıcı Onboarding ve Demo Erişim Sistemi

## Akış

```text
Kayıt Ol → İlk Giriş → /onboarding → Demo Erişim (7 gün) → Panel Keşfi
```

## Backend mimarisi

| Bileşen | Dosya |
|---------|--------|
| `UserLicenseAccess` (+ `IsDemoAccess`, `GrantedAutomatically`, `ExpiresAt`) | `API/Entities/UserLicenseAccess.cs` |
| `UserOnboardingState` | `API/Entities/UserOnboardingState.cs` |
| `OnboardingOptions` | `API/Configuration/OnboardingOptions.cs` |
| `GET /api/onboarding/status` | `API/Controllers/OnboardingController.cs` |
| `POST /api/onboarding/complete` | aynı |
| `IOnboardingService` | `API/Services/OnboardingService.cs` |
| `IDemoAccessService` | `API/Services/DemoAccessService.cs` |
| Kayıt hook | `API/Controllers/AccountController.Register` |

> Spec’teki `StudentPlanAccess` alanları projede `UserLicenseAccess` tablosuna eklendi.

## Demo kuralları

- Yeni öğrenci kaydında otomatik **7 günlük SPK Düzey 1 Demo** (`appsettings` → `Onboarding`)
- Aynı kullanıcıya duplicate demo verilmez
- Süresi dolan erişim `GET /api/onboarding/status` sırasında pasifleştirilir
- Demo deneme limiti: `MaxTrialAttempts` (varsayılan 3)
- Günlük soru limiti: `MaxQuestionsPerDay` (varsayılan 50)

## Frontend

| Parça | Konum |
|-------|--------|
| Onboarding sayfası | `/onboarding` — `Client/src/features/onboarding/OnboardingPage.tsx` |
| Route guard | `Client/src/app/StudentOnboardingGuard.tsx` |
| Zustand store | `Client/src/stores/onboardingStore.ts` |
| Dashboard banner | `DashboardAccessBanner.tsx` |
| Boş panel önleme | `StudentDashboardPage.tsx` |

## Migration

```powershell
cd API
dotnet ef database update
```

## SQL index önerileri

Migration ile gelen:

- `UserOnboardingStates(UserId)` unique
- `UserLicenseAccesses(UserId, IsDemoAccess, IsActive)`
- `UserLicenseAccesses(ExpiresAt)`

## Production checklist

- [ ] `Onboarding` bölümü production `appsettings` içinde doğrulandı
- [ ] Demo lisansı admin panelde içerikle ilişkilendirildi (ders/quiz)
- [ ] Yeni kayıt → demo erişim + onboarding yönlendirmesi test edildi
- [ ] Demo süresi dolunca mesaj ve erişim talep CTA test edildi
