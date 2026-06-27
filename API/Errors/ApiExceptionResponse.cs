namespace API.Errors;

public class ApiErrorResponse
{
    public bool Success { get; set; } = false;

    public int StatusCode { get; set; }

    public string Code { get; set; } = string.Empty;

    public string Message { get; set; } = string.Empty;

    public object? Errors { get; set; }

    public string? TraceId { get; set; }
}

public class ApiValidationError
{
    public string Field { get; set; } = string.Empty;

    public string Message { get; set; } = string.Empty;
}
