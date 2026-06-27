using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace API.Errors;

public static class ApiErrorFactory
{
    public const string ValidationError = "validation_error";
    public const string Unauthorized = "unauthorized";
    public const string Forbidden = "forbidden";
    public const string NotFound = "not_found";
    public const string Conflict = "duplicate_resource";
    public const string RateLimited = "rate_limited";
    public const string ServerError = "server_error";
    public const string BadRequest = "bad_request";

    public static ApiErrorResponse Create(
        int statusCode,
        string code,
        string message,
        object? errors = null,
        string? traceId = null) =>
        new()
        {
            Success = false,
            StatusCode = statusCode,
            Code = code,
            Message = message,
            Errors = errors,
            TraceId = traceId
        };

    public static ApiErrorResponse FromModelState(
        ModelStateDictionary modelState,
        string? traceId = null)
    {
        var errors = modelState
            .Where(x => x.Value?.Errors.Count > 0)
            .SelectMany(x => x.Value!.Errors.Select(error => new ApiValidationError
            {
                Field = x.Key,
                Message = string.IsNullOrWhiteSpace(error.ErrorMessage)
                    ? "Invalid value."
                    : error.ErrorMessage
            }))
            .ToList();

        return Create(
            StatusCodes.Status400BadRequest,
            ValidationError,
            "Validation failed.",
            errors,
            traceId);
    }

    public static string DefaultMessageFor(int statusCode) =>
        statusCode switch
        {
            StatusCodes.Status400BadRequest => "Invalid request.",
            StatusCodes.Status401Unauthorized => "Authentication is required.",
            StatusCodes.Status403Forbidden => "You are not allowed to access this resource.",
            StatusCodes.Status404NotFound => "Resource not found.",
            StatusCodes.Status409Conflict => "Resource already exists or conflicts with current state.",
            StatusCodes.Status429TooManyRequests => "Too many requests. Please try again later.",
            StatusCodes.Status500InternalServerError => "An unexpected error occurred.",
            _ => "Request failed."
        };

    public static string DefaultCodeFor(int statusCode) =>
        statusCode switch
        {
            StatusCodes.Status400BadRequest => BadRequest,
            StatusCodes.Status401Unauthorized => Unauthorized,
            StatusCodes.Status403Forbidden => Forbidden,
            StatusCodes.Status404NotFound => NotFound,
            StatusCodes.Status409Conflict => Conflict,
            StatusCodes.Status429TooManyRequests => RateLimited,
            StatusCodes.Status500InternalServerError => ServerError,
            _ => "request_failed"
        };
}
