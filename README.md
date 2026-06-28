# SPK Akademi

SPK lisans hazirlik surecini ders notlari, soru bankasi, ucretsiz denemeler ve ilerleme takibi ile yoneten tam kapsamli bir calisma platformu.

## Mimari

- `API/`: ASP.NET Core 10 backend
- `Client/`: React + Vite + MUI frontend
- `PostgreSQL`: staging/production veritabani
- `SQLite`: development veritabani
- `Nginx`: reverse proxy ve static delivery

## Ortamlar

- `Development`: SQLite (`API/spk.db`)
- `Staging`: PostgreSQL
- `Production`: PostgreSQL

Konfig dosyalari:

- [API/appsettings.json](API/appsettings.json)
- [API/appsettings.Development.json](API/appsettings.Development.json)
- [API/appsettings.Staging.json](API/appsettings.Staging.json)
- [API/appsettings.Production.json](API/appsettings.Production.json)

## Local gelistirme

### Backend

```powershell
dotnet restore API/API.csproj
dotnet build API/API.csproj
dotnet run --project API/API.csproj
```

Development secret degerleri source control icinde tutulmaz. Ilk lokal kurulumda .NET User Secrets kullan:

```powershell
dotnet user-secrets set "Jwt:Key" "local-dev-jwt-secret-at-least-32-characters" --project API/API.csproj
dotnet user-secrets set "SeedAdmin:Enabled" "true" --project API/API.csproj
dotnet user-secrets set "SeedAdmin:Email" "admin@spkakademi.local" --project API/API.csproj
dotnet user-secrets set "SeedAdmin:Password" "<local-admin-password>" --project API/API.csproj
dotnet user-secrets set "SeedAdmin:DisplayName" "Development Admin" --project API/API.csproj
```

`SeedAdmin` degerleri `appsettings.Development.json` icinde tutulmaz; lokal admin hesabi gerekiyorsa User Secrets ile verilir. `SeedAdmin:Enabled` sadece lokal admin hesabi gerekiyorsa `true` yapilmali. Staging ve Production secret degerleri User Secrets ile degil, deployment secret store veya environment variable ile saglanir.

### Frontend

```powershell
cd Client
npm ci
npm run dev
```

## Docker ile calistirma

1. `.env.example` dosyasini `.env` olarak kopyala.
2. Bos secret alanlarini gercek degerlerle doldur.
3. Asagidaki komutu calistir:

```powershell
docker compose up --build
```

Servisler:

- `nginx`: `http://localhost`
- `api`: internal `http://api:8080`
- `db`: PostgreSQL `5432`

Healthcheck:

- `GET /health`

## Ucretsiz VM uzerinde SQLite ile ilk canliya alma

Mevcut migration seti SQLite ile uyumlu oldugu icin en dusuk riskli ucretsiz canliya alma yolu tek container API + frontend build ve kalici host volume kullanmaktir. Bu senaryoda uygulama frontend dosyalarini kendisi servis eder; ayri nginx veya frontend container gerekmez.

1. `.env.sqlite.example` dosyasini `.env` olarak kopyala.
2. `JWT_KEY` degerini en az 32 karakterlik rastgele guclu bir secret ile doldur.
3. Gercek domain kullanacaksan:

```env
AllowedHosts=ornek-domain.com
Cors__AllowedOrigins__0=https://ornek-domain.com
Seo__PublicBaseUrl=https://ornek-domain.com
```

4. Mevcut lokal veriyi tasiyacaksan once kalici klasorleri hazirla:

```powershell
New-Item -ItemType Directory -Force storage\data, storage\uploads, storage\imports, storage\logs, storage\data-protection
Copy-Item API\spk.db storage\data\spk.db
Copy-Item API\wwwroot\uploads\* storage\uploads\ -Recurse -Force
```

Linux sunucuda ayni islem:

```bash
mkdir -p storage/data storage/uploads storage/imports storage/logs storage/data-protection
cp API/spk.db storage/data/spk.db
cp -a API/wwwroot/uploads/. storage/uploads/
```

5. Uygulamayi baslat:

```bash
docker compose -f docker-compose.sqlite.yml up -d --build
```

Varsayilan port `8080` olur. Portu degistirmek icin `.env` icinde `APP_PORT=80` gibi ayarlayabilirsin. Domain ve HTTPS icin VM onune Caddy veya Nginx reverse proxy konulmasi onerilir.

Kalici dosyalar:

- SQLite DB: `storage/data/spk.db`
- Yuklenen PDF ve destek dosyalari: `storage/uploads`
- Import dosyalari: `storage/imports`
- Loglar: `storage/logs`
- ASP.NET DataProtection keyleri: `storage/data-protection`

Bu klasorler silinirse canli veriler de silinir; VM snapshot/backup almak kritik.

## Migration akisi

Development:

```powershell
dotnet ef migrations add <MigrationName> --project API/API.csproj
dotnet ef database update --project API/API.csproj
```

Production/staging:

- Uygulama startup sirasinda `AutoMigrate=true` ise migration uygular.
- Daha kontrollu rollout istenirse `Database:AutoMigrate=false` yapilip migration ayri pipeline adiminda calistirilabilir.

## Environment degiskenleri

Asagidaki degiskenler kritik:

- `ASPNETCORE_ENVIRONMENT`
- `ConnectionStrings__DefaultConnection`
- `Database__Provider`
- `Jwt__Key`
- `Cors__AllowedOrigins__0`
- `Cors__AllowedOrigins__1`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `Email__Enabled`
- `Email__FromAddress`
- `Email__SmtpHost`
- `Email__SmtpPort`
- `Email__SmtpUser`
- `Email__SmtpPassword`
- `VITE_API_BASE_URL`

Staging ve Production ortamlarinda uygulama fail-fast calisir. Asagidaki durumlarda API acilmaz:

- `Jwt__Key` eksik, kisa veya placeholder ise
- `ConnectionStrings__DefaultConnection` eksik veya placeholder DB sifresi iceriyorsa
- `Email__Enabled=true` iken `Email__SmtpPassword` eksik veya placeholder ise
- `AllowedHosts` development disinda bos veya wildcard ise
- `Cors__AllowedOrigins` development disinda bos, wildcard veya gecersiz origin iceriyorsa

Docker Compose tarafinda secret fallback kullanilmaz. `POSTGRES_PASSWORD`, `ConnectionStrings__DefaultConnection` ve `JWT_KEY` verilmezse compose baslamaz.

## CI/CD

Workflow:

- [`.github/workflows/ci-cd.yml`](.github/workflows/ci-cd.yml)

Calistirdigi adimlar:

- API restore/build
- client lint/build
- docker image build
- `staging` branch push -> staging deploy webhook
- `main` branch push -> production deploy webhook

Gerekli secrets:

- `STAGING_DEPLOY_WEBHOOK_URL`
- `PRODUCTION_DEPLOY_WEBHOOK_URL`
- `STAGING_JWT_KEY`
- `STAGING_DB_PASSWORD`
- `STAGING_SMTP_PASSWORD`
- `PRODUCTION_JWT_KEY`
- `PRODUCTION_DB_PASSWORD`
- `PRODUCTION_SMTP_PASSWORD`

## Production notlari

- JWT secret bilgilerini source control icinde tutma.
- Development icin .NET User Secrets kullan; `appsettings.Development.json` icine JWT key, admin sifresi, SMTP sifresi veya API key yazma.
- Secret degerlerini Azure Key Vault, AWS Secrets Manager, HashiCorp Vault, Docker Secrets veya Kubernetes Secrets uzerinden sagla.
- JWT secret en az 32 karakter, rastgele ve rotate edilebilir olmali.
- Veritabani kullanicisi uygulama icin least-privilege yetkilerle sinirlandirilmali.
- Production domainlerini `Cors:AllowedOrigins` altinda whitelist et.
- Reverse proxy arkasinda `X-Forwarded-*` headerlari ile calisir.
- Static assetler uzun sure cache'lenir, `index.html` cache'lenmez.
- Serilog loglari `logs/` altina gunluk rolling file olarak yazilir.

Test Auto Deploy