namespace API.Middleware;

public class SecurityHeadersMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        context.Response.OnStarting(() =>
        {
            var headers = context.Response.Headers;
            headers["X-Content-Type-Options"] = "nosniff";
            headers["X-Frame-Options"] = "DENY";
            headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
            headers["X-Xss-Protection"] = "0";
            headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
            headers["Content-Security-Policy"] =
                "default-src 'self'; " +
                "img-src 'self' data: https:; " +
                "font-src 'self' data:; " +
                "style-src 'self' 'unsafe-inline'; " +
                "script-src 'self'; " +
                "object-src 'none'; " +
                "connect-src 'self' https: http:; " +
                "frame-ancestors 'none'; " +
                "base-uri 'self'; " +
                "form-action 'self'";

            return Task.CompletedTask;
        });

        await next(context);
    }
}
