using API.Services;

namespace API.UnitTests.Services;

public class PdfTextNormalizerTests
{
    [Fact]
    public void Normalize_RepairsCommonTurkishPdfGlyphSubstitutions()
    {
        const string input =
            "1.1. SERMAYE P1YASASI\n" +
            "Sermaye piyasas1n1n i_leyi_ini do\uFFFDrudan sa\uFFFDlayan ve olu_turan yap1d1r.";

        var result = PdfTextNormalizer.Normalize(input);

        Assert.Equal(
            "1.1. SERMAYE PİYASASI\n" +
            "Sermaye piyasasının işleyişini doğrudan sağlayan ve oluşturan yapıdır.",
            result);
    }

    [Fact]
    public void Normalize_PreservesStandaloneNumbersAndRepairsWrappedWords()
    {
        const string input = "Düzey 1\nsermaye biri-\nkimi 2026 y1l1nda artm1_t1r.";

        var result = PdfTextNormalizer.Normalize(input);

        Assert.Equal("Düzey 1\nsermaye birikimi 2026 yılında artmıştır.", result);
    }

    [Fact]
    public void Normalize_DoesNotRewriteIsolatedValidAlphanumericCodes()
    {
        const string input = "SPK1 kodlu doküman 1. bölümde açıklanmıştır.";

        var result = PdfTextNormalizer.Normalize(input);

        Assert.Equal(input, result);
    }
}
