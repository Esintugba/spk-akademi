using System.IO.Compression;
using System.Net;
using System.Security.Claims;
using System.Text;
using System.Threading.RateLimiting;
using API.Authorization;
using API.Configuration;
using API.Data;
using API.Errors;
using API.Extensions;
using API.Entities;
using API.Filters;
using API.Health;
using API.Middleware;
using API.Services;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Net.Http.Headers;
using Serilog;
using Serilog.Events;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddEnvironmentVariables();

builder.Services.Configure<DatabaseOptions>(builder.Configuration.GetSection(DatabaseOptions.SectionName));
builder.Services.Configure<ForwardedHeadersConfigurationOptions>(builder.Configuration.GetSection(ForwardedHeadersConfigurationOptions.SectionName));
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));
builder.Services.Configure<AuthCookieOptions>(builder.Configuration.GetSection(AuthCookieOptions.SectionName));
builder.Services.Configure<CorsOptions>(builder.Configuration.GetSection(CorsOptions.SectionName));
builder.Services.Configure<RateLimitingOptions>(builder.Configuration.GetSection(RateLimitingOptions.SectionName));
builder.Services.Configure<SeedAdminOptions>(builder.Configuration.GetSection(SeedAdminOptions.SectionName));
builder.Services.Configure<EmailOptions>(builder.Configuration.GetSection(EmailOptions.SectionName));
builder.Services.Configure<BrandingOptions>(builder.Configuration.GetSection(BrandingOptions.SectionName));
builder.Services.Configure<BillingOptions>(builder.Configuration.GetSection(BillingOptions.SectionName));
builder.Services.Configure<OnboardingOptions>(builder.Configuration.GetSection(OnboardingOptions.SectionName));
builder.Services.Configure<GamificationOptions>(builder.Configuration.GetSection(GamificationOptions.SectionName));
builder.Services.Configure<ContactOptions>(builder.Configuration.GetSection(ContactOptions.SectionName));
builder.Services.Configure<SeoOptions>(builder.Configuration.GetSection(SeoOptions.SectionName));
builder.Services.Configure<BackgroundQueueOptions>(builder.Configuration.GetSection(BackgroundQueueOptions.SectionName));
builder.Services.Configure<AiQuestionGenerationOptions>(builder.Configuration.GetSection(AiQuestionGenerationOptions.SectionName));

var dataProtectionKeysPath = builder.Configuration["DataProtection:KeysPath"];
if (!string.IsNullOrWhiteSpace(dataProtectionKeysPath))
{
    Directory.CreateDirectory(dataProtectionKeysPath);
    builder.Services
        .AddDataProtection()
        .PersistKeysToFileSystem(new DirectoryInfo(dataProtectionKeysPath));
}

builder.Host.UseSerilog((context, services, configuration) =>
{
    configuration
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext()
        .MinimumLevel.Override("Microsoft", LogEventLevel.Warning);
});

builder.Services.AddControllersWithViews(options =>
{
    options.Filters.Add<ApiErrorResultFilter>();
});
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var response = ApiErrorFactory.FromModelState(
            context.ModelState,
            context.HttpContext.TraceIdentifier);

        return new BadRequestObjectResult(response);
    };
});
var authCookieOptions = builder.Configuration.GetSection(AuthCookieOptions.SectionName).Get<AuthCookieOptions>() ?? new AuthCookieOptions();
builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = AuthCookieOptions.CsrfHeaderName;
    options.Cookie.Name = authCookieOptions.AntiforgeryCookieName;
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
    options.Cookie.Path = string.IsNullOrWhiteSpace(authCookieOptions.Path) ? "/" : authCookieOptions.Path;
    options.Cookie.SameSite = authCookieOptions.SameSite;
    options.Cookie.SecurePolicy = authCookieOptions.Secure || !builder.Environment.IsDevelopment()
        ? CookieSecurePolicy.Always
        : CookieSecurePolicy.SameAsRequest;
});
builder.Services.AddHttpClient();
builder.Services.AddMemoryCache();
builder.Services.AddHttpContextAccessor();
var apiTitle = builder.Configuration["Branding:ApiTitle"] ?? "SPK Akademi API";
builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer((document, _, _) =>
    {
        document.Info.Title = apiTitle;
        document.Info.Version = "v1";
        document.Info.Description = "SPK Akademi platform REST API";
        return Task.CompletedTask;
    });
});
builder.Services.AddHealthChecks()
    .AddCheck("self", () => HealthCheckResult.Healthy("OK"))
    .AddCheck<ConfigurationHealthCheck>("configuration")
    .AddCheck<BackgroundQueueHealthCheck>("background_queues")
    .AddCheck<DatabaseHealthCheck>("database");
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
    options.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(
        ["application/xml", "text/xml", "text/plain"]);
});
builder.Services.Configure<BrotliCompressionProviderOptions>(options => options.Level = CompressionLevel.Fastest);
builder.Services.Configure<GzipCompressionProviderOptions>(options => options.Level = CompressionLevel.Fastest);
var forwardedHeadersOptions = builder.Configuration
    .GetSection(ForwardedHeadersConfigurationOptions.SectionName)
    .Get<ForwardedHeadersConfigurationOptions>() ?? new ForwardedHeadersConfigurationOptions();

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = forwardedHeadersOptions.Enabled
        ? ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
        : ForwardedHeaders.None;
    options.ForwardLimit = forwardedHeadersOptions.ForwardLimit;
    options.RequireHeaderSymmetry = forwardedHeadersOptions.RequireHeaderSymmetry;

    options.KnownProxies.Clear();
    options.KnownIPNetworks.Clear();

    foreach (var proxy in ParseKnownProxies(forwardedHeadersOptions.KnownProxies))
    {
        options.KnownProxies.Add(proxy);
    }

    foreach (var network in ParseKnownNetworks(forwardedHeadersOptions.KnownNetworks))
    {
        options.KnownIPNetworks.Add(network);
    }
});

builder.Services.AddScoped<IPdfTextExtractor, PdfPigTextExtractor>();
builder.Services.AddScoped<ILicenseAccessService, LicenseAccessService>();
builder.Services.AddScoped<IContentReviewQueryService, ContentReviewQueryService>();
builder.Services.AddScoped<IContentModerationService, ContentModerationService>();
builder.Services.AddScoped<IProgressService, ProgressService>();
builder.Services.AddScoped<IStudentExperienceService, StudentExperienceService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddApplicationServices();

ConfigurationSecurityValidator.ThrowIfInvalid(builder.Configuration, builder.Environment);

var databaseOptions = builder.Configuration.GetSection(DatabaseOptions.SectionName).Get<DatabaseOptions>() ?? new DatabaseOptions();
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("DefaultConnection is not configured.");
connectionString = DatabaseProviderConfigurator.ResolveConnectionString(
    databaseOptions,
    connectionString,
    builder.Environment.ContentRootPath);

builder.Services.AddDbContext<DataContext>(options =>
{
    DatabaseProviderConfigurator.Configure(options, databaseOptions, connectionString);
});

builder.Services
    .AddIdentity<AppUser, IdentityRole>(options =>
    {
        options.User.RequireUniqueEmail = true;
        options.Password.RequireDigit = true;
        options.Password.RequireLowercase = true;
        options.Password.RequireUppercase = true;
        options.Password.RequireNonAlphanumeric = false;
        options.Password.RequiredLength = 6;
        options.Lockout.AllowedForNewUsers = true;
        options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
        options.Lockout.MaxFailedAccessAttempts = 5;
    })
    .AddEntityFrameworkStores<DataContext>()
    .AddDefaultTokenProviders();

var jwtOptions = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();
var jwtValidationKeys = jwtOptions.GetValidationKeys()
    .Select(key => new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)))
    .ToArray();

if (jwtValidationKeys.Length == 0)
{
    throw new InvalidOperationException("Jwt:Key is not configured.");
}

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidAudience = jwtOptions.Audience,
            IssuerSigningKeys = jwtValidationKeys,
            ClockSkew = TimeSpan.FromSeconds(30)
        };
        options.Events = new JwtBearerEvents
        {
            OnChallenge = async context =>
            {
                context.HandleResponse();
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;

                var response = ApiErrorFactory.Create(
                    StatusCodes.Status401Unauthorized,
                    ApiErrorFactory.Unauthorized,
                    "Authentication is required.",
                    traceId: context.HttpContext.TraceIdentifier);

                await context.Response.WriteAsJsonAsync(response);
            },
            OnForbidden = async context =>
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;

                var response = ApiErrorFactory.Create(
                    StatusCodes.Status403Forbidden,
                    ApiErrorFactory.Forbidden,
                    "You are not allowed to access this resource.",
                    traceId: context.HttpContext.TraceIdentifier);

                await context.Response.WriteAsJsonAsync(response);
            }
        };
    });

builder.Services.AddAuthorization(options => options.AddAppAuthorizationPolicies());

var corsOptions = builder.Configuration.GetSection(CorsOptions.SectionName).Get<CorsOptions>() ?? new CorsOptions();
var allowedCorsOrigins = corsOptions.AllowedOrigins
    .Where(origin => !string.IsNullOrWhiteSpace(origin))
    .Select(origin => origin.Trim())
    .Distinct(StringComparer.OrdinalIgnoreCase)
    .ToArray();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AppCors", policy =>
    {
        if (allowedCorsOrigins.Length > 0)
        {
            policy.WithOrigins(allowedCorsOrigins)
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials();
        }
        else if (builder.Environment.IsDevelopment())
        {
            policy.SetIsOriginAllowed(origin =>
                    Uri.TryCreate(origin, UriKind.Absolute, out var uri) &&
                    (uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase) ||
                     uri.Host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase)))
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials();
        }
        else
        {
            throw new InvalidOperationException("Cors:AllowedOrigins must be configured outside Development.");
        }
    });
});

var rateLimitingOptions = builder.Configuration.GetSection(RateLimitingOptions.SectionName).Get<RateLimitingOptions>() ?? new RateLimitingOptions();
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;

        var response = ApiErrorFactory.Create(
            StatusCodes.Status429TooManyRequests,
            ApiErrorFactory.RateLimited,
            "Too many requests. Please try again later.",
            traceId: context.HttpContext.TraceIdentifier);

        await context.HttpContext.Response.WriteAsJsonAsync(response, cancellationToken);
    };

    options.AddPolicy("api", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: GetUserOrIpPartitionKey(httpContext),
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = rateLimitingOptions.PermitLimit,
                Window = TimeSpan.FromSeconds(rateLimitingOptions.WindowSeconds),
                QueueLimit = rateLimitingOptions.QueueLimit,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                AutoReplenishment = true
            }));

    options.AddPolicy("auth", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: $"ip:{GetClientIpAddress(httpContext)}:path:{GetNormalizedPath(httpContext)}",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 20,
                Window = TimeSpan.FromMinutes(5),
                QueueLimit = 0,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                AutoReplenishment = true
            }));

    options.AddPolicy("contact", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: $"ip:{GetClientIpAddress(httpContext)}",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 3,
                Window = TimeSpan.FromMinutes(5),
                QueueLimit = 0,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                AutoReplenishment = true
            }));

    options.AddPolicy("ai-generation", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: GetUserOrIpPartitionKey(httpContext),
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(10),
                QueueLimit = 0,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                AutoReplenishment = true
            }));
});

var app = builder.Build();

app.UseSerilogRequestLogging();
app.UseMiddleware<ExceptionMiddleware>();
app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseForwardedHeaders();

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/openapi/v1/openapi.json", "SPK Akademi API");
    });
}
app.UseResponseCompression();
app.UseCors("AppCors");
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

var webRootPath = Path.Combine(app.Environment.ContentRootPath, "wwwroot");
if (Directory.Exists(webRootPath))
{
    // Sensitive uploads are served through authorized/tokenized endpoints, never as public static files.
    app.Use(async (context, next) =>
    {
        if (context.Request.Path.StartsWithSegments(
                new PathString("/uploads/source-documents"),
                StringComparison.OrdinalIgnoreCase) ||
            context.Request.Path.StartsWithSegments(
                new PathString("/uploads/support-tickets"),
                StringComparison.OrdinalIgnoreCase))
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            return;
        }

        await next();
    });

    app.UseDefaultFiles();
    app.UseStaticFiles(new StaticFileOptions
    {
        OnPrepareResponse = context =>
        {
            var isIndexFile = context.File.Name.Equals("index.html", StringComparison.OrdinalIgnoreCase);
            context.Context.Response.Headers[HeaderNames.CacheControl] = isIndexFile
                ? "no-cache, no-store, must-revalidate"
                : "public, max-age=2592000, immutable";
        }
    });
}

app.MapHealthChecks("/health").AllowAnonymous();
app.MapControllers().RequireRateLimiting("api");

if (File.Exists(Path.Combine(webRootPath, "index.html")))
{
    app.MapFallbackToFile("index.html");
}

await app.InitialiseDatabaseAsync();
await RoleSeeder.SeedRoles(app);

app.Run();

static IEnumerable<IPAddress> ParseKnownProxies(IEnumerable<string> proxies)
{
    foreach (var proxy in proxies.Where(value => !string.IsNullOrWhiteSpace(value)))
    {
        if (!IPAddress.TryParse(proxy.Trim(), out var address))
        {
            throw new InvalidOperationException($"ForwardedHeaders:KnownProxies contains an invalid IP address: {proxy}.");
        }

        yield return address;

        if (address.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork)
        {
            yield return address.MapToIPv6();
        }
    }
}

static IEnumerable<System.Net.IPNetwork> ParseKnownNetworks(IEnumerable<string> networks)
{
    foreach (var network in networks.Where(value => !string.IsNullOrWhiteSpace(value)))
    {
        var parts = network.Trim().Split('/', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);

        if (parts.Length != 2 ||
            !IPAddress.TryParse(parts[0], out var prefix) ||
            !int.TryParse(parts[1], out var prefixLength))
        {
            throw new InvalidOperationException($"ForwardedHeaders:KnownNetworks contains an invalid CIDR network: {network}.");
        }

        yield return new System.Net.IPNetwork(prefix, prefixLength);

        if (prefix.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork)
        {
            yield return new System.Net.IPNetwork(prefix.MapToIPv6(), prefixLength + 96);
        }
    }
}

static string GetUserOrIpPartitionKey(HttpContext httpContext)
{
    var userId = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);

    return !string.IsNullOrWhiteSpace(userId)
        ? $"user:{userId}"
        : $"ip:{GetClientIpAddress(httpContext)}";
}

static string GetClientIpAddress(HttpContext httpContext)
{
    return httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
}

static string GetNormalizedPath(HttpContext httpContext)
{
    return httpContext.Request.Path.Value?.ToLowerInvariant() ?? "/";
}
