using API.Configuration;
using API.Services;
using Microsoft.Extensions.Options;

namespace API.UnitTests.Services;

public class PdfSourcePageServiceTests
{
    [Fact]
    public void SelectPageRange_ReturnsOnlyRequestedPages()
    {
        var service = CreateService();
        var extractedText = """
            --- Page 1 ---
            Birinci sayfa

            --- Page 2 ---
            İkinci sayfa

            --- Page 3 ---
            Üçüncü sayfa
            """;

        var result = service.SelectPageRange(extractedText, 2, 3);

        Assert.DoesNotContain("Birinci sayfa", result);
        Assert.Contains("--- Page 2 ---", result);
        Assert.Contains("İkinci sayfa", result);
        Assert.Contains("--- Page 3 ---", result);
    }

    [Fact]
    public void SelectPageRange_RejectsMissingPage()
    {
        var service = CreateService();
        var extractedText = """
            --- Page 1 ---
            Birinci sayfa
            --- Page 3 ---
            Üçüncü sayfa
            """;

        var exception = Assert.Throws<InvalidOperationException>(
            () => service.SelectPageRange(extractedText, 1, 3));

        Assert.Contains("tamamı", exception.Message);
    }

    [Fact]
    public void SelectPageRange_RejectsOversizedSelection()
    {
        var service = CreateService(maxCharacters: 1000);
        var extractedText = $"--- Page 1 ---\n{new string('x', 1001)}";

        var exception = Assert.Throws<InvalidOperationException>(
            () => service.SelectPageRange(extractedText, 1, 1));

        Assert.Contains("sınırını aşıyor", exception.Message);
    }

    private static PdfSourcePageService CreateService(int maxCharacters = 60_000) =>
        new(Options.Create(new AiQuestionGenerationOptions
        {
            MaxSourceCharacters = maxCharacters
        }));
}
