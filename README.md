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
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$jwtKey = [Convert]::ToBase64String($bytes)
dotnet user-secrets set "Jwt:Key" $jwtKey --project API/API.csproj
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
2. Bos secret alanlarini deployment secret store degerleriyle doldur. Gercek secret degerlerini repoya yazma.
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
2. `JWT_KEY` degerini en az 32 byte kriptografik rastgele secret ile doldur.
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

- Varsayilan olarak `Database:AutoMigrate=false` kullanilir.
- Migration production/staging icin CI/CD pipeline veya kontrollu operator adimi olarak uygulanmalidir.

## Environment degiskenleri

Asagidaki degiskenler kritik:

- `ASPNETCORE_ENVIRONMENT`
- `ConnectionStrings__DefaultConnection`
- `Database__Provider`
- `ForwardedHeaders__Enabled`
- `ForwardedHeaders__KnownProxies__0`
- `ForwardedHeaders__KnownNetworks__0`
- `ForwardedHeaders__ForwardLimit`
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

## Forwarded headers ve reverse proxy

API, reverse proxy arkasinda calisirken client IP ve scheme bilgisini sadece guvenilen proxy'lerden gelen forwarded header'lardan okur. Guvenilmeyen kaynaklardan gelen `X-Forwarded-For` ve `X-Forwarded-Proto` header'lari kabul edilmez.

Production icin temel ayarlar:

```env
ForwardedHeaders__Enabled=true
ForwardedHeaders__KnownProxies__0=172.30.0.10
ForwardedHeaders__ForwardLimit=1
ForwardedHeaders__RequireHeaderSymmetry=true
```

Docker Compose senaryosunda Nginx container'i `172.30.0.10` internal IP adresine sabitlenir ve API sadece bu proxy'den gelen forwarded header'lari isler. Subnet host ortaminda cakisirsa `docker-compose.yml` icindeki network subnet'i ve `ForwardedHeaders__KnownProxies__0` birlikte degistirilmelidir.

Proxy kurallari:

- Direct API access: `ForwardedHeaders__Enabled=false`; rate limit TCP remote IP uzerinden calisir.
- Nginx -> API: API tarafinda sadece Nginx IP'si `KnownProxies` olmalidir. Nginx upstream'e `X-Forwarded-For $remote_addr` gondererek client'in sahte XFF header'ini tasimamali.
- Cloudflare -> Nginx -> API: API sadece Nginx'e guvenir. Nginx Cloudflare IP range'lerini `set_real_ip_from` ile dogrulamali, `CF-Connecting-IP` degerini yalniz Cloudflare'dan geldiyse client IP olarak upstream'e aktarmalidir. Cloudflare bypass'i engellemek icin origin firewall sadece Cloudflare/Nginx yolunu kabul etmelidir.
- Caddy veya Traefik -> API: API tarafinda Caddy/Traefik container veya load balancer IP'si `KnownProxies` olarak verilir.
- Kubernetes Ingress -> API: Ingress controller pod/service CIDR'i `KnownNetworks` veya sabit ingress IP'leri `KnownProxies` olarak verilir. Tum cluster/private network'e gerekmedikce guvenilmemelidir.
- OCI Load Balancer -> API: Load balancer private IP'leri veya subnet'i `KnownProxies`/`KnownNetworks` olarak tanimlanir; API public internete dogrudan acilmamalidir.

Rate limiting partition stratejisi:

- Genel API: authenticated kullanici varsa `user:{id}`, yoksa `ip:{clientIp}`.
- Auth endpointleri: `ip:{clientIp}:path:{path}`.
- Contact endpointleri: `ip:{clientIp}`.

Bu model IP spoofing'e karsi forwarded headers middleware'in guvenli proxy listesini temel alir. `RemoteIpAddress` sadece direct access'te TCP peer IP'si veya guvenilen proxy tarafindan dogrulanmis forwarded client IP'si oldugunda guvenilir kabul edilir.

## JWT secret yonetimi

JWT signing key source control icinde tutulmaz. `API/appsettings.json`, `API/appsettings.Development.json`, `API/appsettings.Staging.json` ve `API/appsettings.Production.json` icinde gercek JWT secret bulunmamalidir. Uygulama JWT key'i su kaynaklardan alir:

1. Command-line arguments
2. Environment variables, Docker/Kubernetes/secret manager tarafindan process environment olarak verilen degerler dahil
3. Development ortaminda .NET User Secrets
4. `appsettings.{Environment}.json`
5. `appsettings.json`

ASP.NET Core icin standart environment variable adi `Jwt__Key`'dir. Docker Compose bu degeri `.env` icindeki `JWT_KEY` degiskeninden `Jwt__Key` olarak API container'ina aktarir.

Guclu JWT key uretimi:

```powershell
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

```bash
openssl rand -base64 32
```

```bash
head -c 32 /dev/urandom | base64
```

Minimum gereksinim:

- En az 32 UTF-8 byte.
- Kriptografik rastgele uretilmis olmali.
- `secret`, `password`, `example`, `demo`, `default`, `test`, `spkakademi`, `supersecret` gibi tahmin edilebilir kelimeler icermemeli.
- Production secret Azure Key Vault, AWS Secrets Manager, HashiCorp Vault, Docker Secret, Kubernetes Secret, OCI Secret veya CI/CD secret store uzerinden saglanmali.

Docker icin:

```env
JWT_KEY=<secret-manager-or-ci-cd-value>
```

JWT rotation:

1. Yeni key uret ve `JWT_KEY` olarak deploy et.
2. Eski key'i gecici olarak `JWT_PREVIOUS_KEY_0` ile ver.
3. Access token suresi dolana kadar current + previous key dogrulanir, yeni tokenlar sadece current key ile imzalanir.
4. En uzun access token suresi ve gerekli operasyon penceresi dolduktan sonra `JWT_PREVIOUS_KEY_0` kaldirilir.
5. Refresh tokenlar veritabaninda hash'li tutulur; signing key degisimi refresh tokenlari otomatik gecersiz kilmaz. Zorunlu logout istenirse kullanicilarin refresh token alanlari temizlenmelidir.

## Refresh token cookie ve CSRF

Refresh token JavaScript tarafindan okunabilir storage alanlarinda tutulmaz. Backend login ve refresh cevaplarinda refresh token'i response body'sinden cikarir ve HttpOnly cookie olarak yazar:

- Cookie adi: `__Host-spk-refresh`
- `HttpOnly=true`
- `Secure=true` production/staging icin zorunlu
- `SameSite=Lax`
- `Path=/`
- Domain verilmez; `__Host-` prefix host-only cookie semantigini zorunlu kilar

Frontend access token'i sadece memory'de tutar. Sayfa yenilendiginde access token kaybolur; uygulama `/api/account/refresh` endpoint'ine cookie ile sessiz refresh dener ve yeni access token'i memory'ye alir.

Cookie refresh modeli CSRF riski olusturdugu icin auth cookie kullanan endpointler antiforgery token ister. Frontend once `/api/account/csrf` endpoint'inden token alir, sonra unsafe isteklerde `X-XSRF-TOKEN` header'ini gonderir. CORS policy credential destekler ve sadece explicit `Cors__AllowedOrigins` degerlerine izin verir.

Production ortaminda asagidaki ayarlar degistirilmemelidir:

```env
AuthCookies__RefreshTokenCookieName=__Host-spk-refresh
AuthCookies__AntiforgeryCookieName=__Host-spk-antiforgery
AuthCookies__SameSite=Lax
AuthCookies__Secure=true
AuthCookies__Path=/
```

Development ortaminda HTTP localhost icin cookie isimleri `spk-refresh-dev` ve `spk-antiforgery-dev`, `Secure=false` olarak override edilir. Production her zaman HTTPS arkasinda calismalidir.

Staging ve Production ortamlarinda uygulama fail-fast calisir. Asagidaki durumlarda API acilmaz:

- `Jwt__Key` eksik, kisa, dusuk entropy'li, source-controlled eski deger, placeholder veya tahmin edilebilir ise
- `Jwt__PreviousKeys__*` degerleri zayif, tekrarli veya current key ile ayni ise
- `ConnectionStrings__DefaultConnection` eksik veya placeholder DB sifresi iceriyorsa
- `Email__Enabled=true` iken `Email__SmtpPassword` eksik veya placeholder ise
- `AllowedHosts` development disinda bos veya wildcard ise
- `Cors__AllowedOrigins` development disinda bos, wildcard veya gecersiz origin iceriyorsa
- `ForwardedHeaders__Enabled=true` iken development disinda `KnownProxies` veya `KnownNetworks` bos ise
- `AuthCookies__Secure=false` development disinda kullanilirsa
- `AuthCookies__SameSite=None` production/staging icin review edilmeden kullanilirsa

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
- `STAGING_JWT_PREVIOUS_KEY_0` (sadece rotation penceresinde)
- `STAGING_DB_PASSWORD`
- `STAGING_SMTP_PASSWORD`
- `PRODUCTION_JWT_KEY`
- `PRODUCTION_JWT_PREVIOUS_KEY_0` (sadece rotation penceresinde)
- `PRODUCTION_DB_PASSWORD`
- `PRODUCTION_SMTP_PASSWORD`

## Production notlari

- JWT secret bilgilerini source control icinde tutma.
- Development icin .NET User Secrets kullan; `appsettings.Development.json` icine JWT key, admin sifresi, SMTP sifresi veya API key yazma.
- Secret degerlerini Azure Key Vault, AWS Secrets Manager, HashiCorp Vault, Docker Secrets veya Kubernetes Secrets uzerinden sagla.
- JWT secret en az 32 byte, kriptografik rastgele ve rotate edilebilir olmali.
- Veritabani kullanicisi uygulama icin least-privilege yetkilerle sinirlandirilmali.
- Production domainlerini `Cors:AllowedOrigins` altinda whitelist et.
- Reverse proxy arkasinda sadece tanimli `KnownProxies`/`KnownNetworks` uzerinden gelen `X-Forwarded-*` headerlari ile calisir.
- Static assetler uzun sure cache'lenir, `index.html` cache'lenmez.
- Serilog loglari `logs/` altina gunluk rolling file olarak yazilir.

Test Auto Deploy
