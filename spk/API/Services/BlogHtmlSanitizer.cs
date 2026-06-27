using System.Net;
using System.Text;
using System.Text.RegularExpressions;

namespace API.Services;

public static partial class BlogHtmlSanitizer
{
    private static readonly HashSet<string> AllowedTags = new(StringComparer.OrdinalIgnoreCase)
    {
        "p",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "ul",
        "ol",
        "li",
        "strong",
        "em",
        "blockquote",
        "table",
        "thead",
        "tbody",
        "tr",
        "td",
        "th",
        "img",
        "a",
        "br",
        "hr"
    };

    private static readonly HashSet<string> VoidTags = new(StringComparer.OrdinalIgnoreCase)
    {
        "br",
        "hr",
        "img"
    };

    private static readonly Dictionary<string, HashSet<string>> AllowedAttributes = new(StringComparer.OrdinalIgnoreCase)
    {
        ["a"] = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "href", "title", "target", "rel" },
        ["img"] = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "src", "alt", "title", "width", "height" },
        ["td"] = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "colspan", "rowspan" },
        ["th"] = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "colspan", "rowspan" }
    };

    public static string Sanitize(string? html)
    {
        if (string.IsNullOrWhiteSpace(html))
        {
            return string.Empty;
        }

        var withoutBlockedElements = BlockedElementRegex().Replace(html, string.Empty);
        return HtmlTagRegex().Replace(withoutBlockedElements, SanitizeTag);
    }

    private static string SanitizeTag(Match match)
    {
        var isClosingTag = match.Groups["close"].Success;
        var tagName = match.Groups["tag"].Value.ToLowerInvariant();

        if (!AllowedTags.Contains(tagName))
        {
            return string.Empty;
        }

        if (isClosingTag)
        {
            return VoidTags.Contains(tagName) ? string.Empty : $"</{tagName}>";
        }

        var attributes = SanitizeAttributes(tagName, match.Groups["attrs"].Value);
        var spacer = attributes.Length == 0 ? string.Empty : " ";
        return VoidTags.Contains(tagName)
            ? $"<{tagName}{spacer}{attributes}>"
            : $"<{tagName}{spacer}{attributes}>";
    }

    private static string SanitizeAttributes(string tagName, string attributes)
    {
        if (!AllowedAttributes.TryGetValue(tagName, out var allowedAttributes))
        {
            return string.Empty;
        }

        var sanitized = new StringBuilder();

        foreach (Match match in AttributeRegex().Matches(attributes))
        {
            var name = match.Groups["name"].Value.ToLowerInvariant();
            if (!allowedAttributes.Contains(name) || name.StartsWith("on", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            var value = match.Groups["value"].Success ? match.Groups["value"].Value : string.Empty;
            if ((name is "href" or "src") && !IsSafeUrl(value))
            {
                continue;
            }

            if ((name is "width" or "height" or "colspan" or "rowspan") && !IsPositiveInteger(value))
            {
                continue;
            }

            if (name == "target" && value != "_blank")
            {
                continue;
            }

            if (sanitized.Length > 0)
            {
                sanitized.Append(' ');
            }

            sanitized.Append(name);
            sanitized.Append("=\"");
            sanitized.Append(WebUtility.HtmlEncode(value));
            sanitized.Append('"');

            if (tagName == "a" && name == "target")
            {
                sanitized.Append(" rel=\"noopener noreferrer\"");
            }
        }

        return sanitized.ToString();
    }

    private static bool IsSafeUrl(string value)
    {
        var decoded = WebUtility.HtmlDecode(value).Trim();
        if (string.IsNullOrWhiteSpace(decoded))
        {
            return false;
        }

        if (decoded.StartsWith('/') || decoded.StartsWith('#'))
        {
            return true;
        }

        return Uri.TryCreate(decoded, UriKind.Absolute, out var uri) &&
            uri.Scheme is "http" or "https" or "mailto" or "tel";
    }

    private static bool IsPositiveInteger(string value)
    {
        return int.TryParse(value, out var number) && number > 0;
    }

    [GeneratedRegex("<\\s*(script|iframe|object|embed|svg|form|input|button|style|link|textarea|select)\\b[^>]*>.*?<\\s*/\\s*\\1\\s*>", RegexOptions.IgnoreCase | RegexOptions.Singleline)]
    private static partial Regex BlockedElementRegex();

    [GeneratedRegex("<\\s*(?<close>/)?\\s*(?<tag>[a-zA-Z][a-zA-Z0-9]*)\\b(?<attrs>[^>]*)>", RegexOptions.IgnoreCase)]
    private static partial Regex HtmlTagRegex();

    [GeneratedRegex("(?<name>[a-zA-Z_:][-a-zA-Z0-9_:.]*)\\s*(=\\s*(\"(?<value>[^\"]*)\"|'(?<value>[^']*)'|(?<value>[^\\s\"'>]+)))?", RegexOptions.IgnoreCase)]
    private static partial Regex AttributeRegex();
}
