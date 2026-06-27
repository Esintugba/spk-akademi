# Erişim Talep / Beta Başvuru Sistemi

## API

| Method | Endpoint | Yetki |
|--------|----------|-------|
| POST | `/api/access-requests` | Student |
| GET | `/api/access-requests/my` | Student |
| GET | `/api/admin/access-requests` | Admin |
| PATCH | `/api/admin/access-requests/{id}/status` | Admin |

`planId` = `LicenseId` (mevcut lisans modeli).

## Durumlar

- Pending, Approved, Rejected, Waitlisted, Cancelled
- Duplicate engeli: Pending / Waitlisted / Approved için aynı plana yeni başvuru yok

## Onay akışı

`Approved` → `UserLicenseAccess` oluşturulur veya aktifleştirilir (`AccessSource.Beta`).

## E-posta

`appsettings.json`:

```json
"Email": {
  "Enabled": false,
  "FromAddress": "noreply@example.com",
  "FromName": "SPK Akademi",
  "SmtpHost": "",
  "SmtpPort": 587
}
```

`Enabled: false` iken mailler log’a yazılır (geliştirme).

## Frontend

- `/plans` — Erişim Talep Et modal
- `/dashboard/access-requests` — öğrenci başvuru listesi
- `/admin/access-requests` — admin kuyruk

## Migration

```bash
cd API
dotnet ef database update
```

Migration: `AddAccessRequestSystem`
