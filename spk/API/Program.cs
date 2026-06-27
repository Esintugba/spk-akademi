using System.IO.Compression;
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
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Net.Http.Headers;
using Serilog;
using Serilog.Events;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddEnvironmentVariables();

builder.Services.Configure<DatabaseOptions>(builder.Configuration.GetSection(DatabaseOptions.SectionName));
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

builder.Services.AddControllers(options =>
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
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
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

builder.Services.AddDbContext<DataContext>(options =>
{
    var provider = databaseOptions.Provider.Trim().ToLowerInvariant();

    if (provider is "postgres" or "postgresql" or "npgsql")
    {
        options.UseNpgsql(connectionString);
        options.ConfigureWarnings(warnings => warnings.Ignore(RelationalEventId.PendingModelChangesWarning));
        return;
    }

    options.UseSqlite(connectionString);
    options.ConfigureWarnings(warnings => warnings.Ignore(RelationalEventId.PendingModelChangesWarning));
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
    })
    .AddEntityFrameworkStores<DataContext>()
    .AddDefaultTokenProviders();

var jwtKey = builder.Configuration["Jwt:Key"] ??
    throw new InvalidOperationException("Jwt:Key is not configured.");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "spk-api";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "spk-client";

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
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
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
                .AllowAnyHeader();
        }
        else if (builder.Environment.IsDevelopment())
        {
            policy.AllowAnyOrigin()
                .AllowAnyMethod()
                .AllowAnyHeader();
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
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = rateLimitingOptions.PermitLimit,
                Window = TimeSpan.FromSeconds(rateLimitingOptions.WindowSeconds),
                QueueLimit = rateLimitingOptions.QueueLimit,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                AutoReplenishment = true
            }));

    options.AddPolicy("contact", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 3,
                Window = TimeSpan.FromMinutes(5),
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
