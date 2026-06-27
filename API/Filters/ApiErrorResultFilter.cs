using API.Errors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace API.Filters;

public class ApiErrorResultFilter : IAlwaysRunResultFilter
{
    public void OnResultExecuting(ResultExecutingContext context)
    {
        if (TryGetErrorStatusCode(context.Result, out var statusCode, out var value))
        {
            if (value is ApiErrorResponse)
            {
                return;
            }

            var errors = ExtractErrors(value);
            var message = ExtractMessage(value) ?? ApiErrorFactory.DefaultMessageFor(statusCode);
            var response = ApiErrorFactory.Create(
                statusCode,
                ApiErrorFactory.DefaultCodeFor(statusCode),
                message,
                errors,
                context.HttpContext.TraceIdentifier);

            context.Result = new ObjectResult(response)
            {
                StatusCode = statusCode
            };
        }
    }

    public void OnResultExecuted(ResultExecutedContext context)
    {
    }

    private static bool TryGetErrorStatusCode(
        IActionResult result,
        out int statusCode,
        out object? value)
    {
        statusCode = 0;
        value = null;

        switch (result)
        {
            case ObjectResult objectResult:
                statusCode = objectResult.StatusCode ?? StatusCodes.Status200OK;
                value = objectResult.Value;
                break;
            case StatusCodeResult statusCodeResult:
                statusCode = statusCodeResult.StatusCode;
                break;
            default:
                return false;
        }

        return statusCode >= StatusCodes.Status400BadRequest;
    }

    private static string? ExtractMessage(object? value)
    {
        if (value is null)
        {
            return null;
        }

        if (value is string message)
        {
            return message;
        }

        if (value is ProblemDetails problemDetails)
        {
            return problemDetails.Detail ?? problemDetails.Title;
        }

        var messageProperty = value
            .GetType()
            .GetProperties()
            .FirstOrDefault(property =>
                property.Name.Equals("message", StringComparison.OrdinalIgnoreCase) &&
                property.PropertyType == typeof(string));

        return messageProperty?.GetValue(value) as string;
    }

    private static object? ExtractErrors(object? value)
    {
        if (value is ValidationProblemDetails validationProblemDetails)
        {
            return validationProblemDetails.Errors
                .SelectMany(x => x.Value.Select(message => new ApiValidationError
                {
                    Field = x.Key,
                    Message = message
                }))
                .ToList();
        }

        return null;
    }
}
