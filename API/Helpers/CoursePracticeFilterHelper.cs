using System.Text.Json;
using API.Entities;

namespace API.Helpers;

public static class CoursePracticeFilterHelper
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    public static CoursePracticeFilterSnapshot? TryParse(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return null;
        }

        try
        {
            return JsonSerializer.Deserialize<CoursePracticeFilterSnapshot>(json, JsonOptions);
        }
        catch
        {
            return null;
        }
    }
}
