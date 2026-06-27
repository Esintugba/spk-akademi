using System.Net;
using System.Text.Json;
using API.Errors;

namespace API.Middleware;

public class ExceptionMiddleware(
    RequestDelegate next,
    ILogger<ExceptionMiddleware> logger,
    IHostEnvironment environment)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unexpected server error.");

            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

            var response = environment.IsDevelopment()
                ? ApiErrorFactory.Create(
                    context.Response.StatusCode,
                    ApiErrorFactory.ServerError,
                    ex.Message,
                    new { details = ex.StackTrace },
                    context.TraceIdentifier)
                : ApiErrorFactory.Create(
                    context.Response.StatusCode,
                    ApiErrorFactory.ServerError,
                    "Sunucuda beklenmeyen bir hata olustu.",
                    traceId: context.TraceIdentifier);

            var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            await context.Response.WriteAsync(json);
        }
    }
}
