using System.Text;
using System.Text.RegularExpressions;

namespace API.Services;

public static class PdfTextNormalizer
{
    private static readonly Regex BrokenDotlessIWordRegex = new(
        @"[\p{L}1]*1[\p{L}1]*",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex BrokenSRegex = new(
        @"(?<=\p{L})_(?=\p{L})|(?<![\p{L}\p{N}])_(?=\p{L})",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex BrokenGRegex = new(
        @"(?<=\p{L})[\u001F\uFFFD\uF8FF\u25A1\u25A0](?=\p{L})",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex WrappedWordRegex = new(
        @"(?<=\p{L})-[ \t]*\n[ \t]*(?=\p{Ll})",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex HorizontalWhitespaceRegex = new(
        @"[\t\f\v\u00A0]+",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex SpaceAroundLineBreakRegex = new(
        @" *\n *",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex ExcessiveLineBreakRegex = new(
        @"\n{3,}",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex MissingSentenceSpaceRegex = new(
        @"(?<=[.!?;:])(?=\p{Lu})",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    public static string Normalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var text = value
            .Normalize(NormalizationForm.FormKC)
            .Replace("\r\n", "\n", StringComparison.Ordinal)
            .Replace('\r', '\n')
            .Replace("\u00AD", string.Empty, StringComparison.Ordinal)
            .Replace("\u200B", string.Empty, StringComparison.Ordinal)
            .Replace("\uFEFF", string.Empty, StringComparison.Ordinal);

        text = WrappedWordRegex.Replace(text, string.Empty);
        if (HasBrokenTurkishGlyphEncoding(text))
        {
            text = BrokenDotlessIWordRegex.Replace(text, match =>
            {
                if (!match.Value.Any(char.IsLetter))
                {
                    return match.Value;
                }

                var letters = match.Value.Where(char.IsLetter).ToArray();
                var replacement = letters.Length > 0 && letters.All(char.IsUpper) ? "İ" : "ı";
                return match.Value.Replace("1", replacement, StringComparison.Ordinal);
            });
            text = BrokenSRegex.Replace(text, match => IsUppercaseContext(text, match.Index) ? "Ş" : "ş");
            text = BrokenGRegex.Replace(text, match => IsUppercaseContext(text, match.Index) ? "Ğ" : "ğ");
        }

        text = HorizontalWhitespaceRegex.Replace(text, " ");
        text = SpaceAroundLineBreakRegex.Replace(text, "\n");
        text = ExcessiveLineBreakRegex.Replace(text, "\n\n");
        text = MissingSentenceSpaceRegex.Replace(text, " ");

        return text.Trim();
    }

    private static bool HasBrokenTurkishGlyphEncoding(string text)
    {
        var brokenICount = BrokenDotlessIWordRegex
            .Matches(text)
            .Count(match => match.Value.Any(char.IsLetter));
        var brokenSCount = BrokenSRegex.Matches(text).Count;
        var brokenGCount = BrokenGRegex.Matches(text).Count;

        return brokenGCount > 0 ||
               brokenICount >= 2 ||
               brokenSCount >= 2 ||
               (brokenICount > 0 && brokenSCount > 0);
    }

    private static bool IsUppercaseContext(string text, int index)
    {
        var previous = index > 0 ? text[index - 1] : '\0';
        var next = index + 1 < text.Length ? text[index + 1] : '\0';
        var adjacentLetters = new[] { previous, next }.Where(char.IsLetter).ToArray();
        return adjacentLetters.Length > 0 && adjacentLetters.All(char.IsUpper);
    }
}
