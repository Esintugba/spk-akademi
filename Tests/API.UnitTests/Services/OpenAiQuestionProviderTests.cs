using System.Net;
using System.Text;
using System.Text.Json;
using API.Configuration;
using API.Entities;
using API.Services;
using Microsoft.Extensions.Options;

namespace API.UnitTests.Services;

public class OpenAiQuestionProviderTests
{
    [Fact]
    public async Task GenerateAsync_UsesStrictSchemaAndParsesGroundedQuestion()
    {
        const string sourceExcerpt = "Yatırım kuruluşları faaliyet izni almalıdır.";
        var outputPayload = JsonSerializer.Serialize(new
        {
            questions = new[]
            {
                new
                {
                    questionText = "Yatırım kuruluşlarının faaliyete başlaması için gereken nedir?",
                    optionA = "Faaliyet izni",
                    optionB = "Vergi muafiyeti",
                    optionC = "Borsa üyeliği",
                    optionD = "Kredi notu",
                    optionE = "",
                    correctOption = "A",
                    explanation = "Kaynakta faaliyet izni gerektiği belirtilmektedir.",
                    difficulty = "Medium",
                    sourcePage = 2,
                    sourceExcerpt
                }
            }
        });
        var responsePayload = JsonSerializer.Serialize(new
        {
            status = "completed",
            output = new[]
            {
                new
                {
                    type = "message",
                    content = new[]
                    {
                        new { type = "output_text", text = outputPayload }
                    }
                }
            },
            usage = new { input_tokens = 120, output_tokens = 80 }
        });
        var handler = new CapturingHandler(responsePayload);
        var provider = new OpenAiQuestionProvider(
            new TestHttpClientFactory(handler),
            Options.Create(new AiQuestionGenerationOptions
            {
                Enabled = true,
                ApiKey = "unit-test-key",
                BaseUrl = "https://api.openai.com/v1/",
                Model = "gpt-5.6"
            }));
        var input = new AiQuestionGenerationInput(
            "Test PDF",
            "Yatırım Kuruluşları",
            2,
            2,
            0,
            1,
            0,
            true,
            $"--- Page 2 ---\n{sourceExcerpt}");

        var result = await provider.GenerateAsync(input);

        var question = Assert.Single(result.Questions);
        Assert.Equal(QuestionDifficulty.Medium, question.Difficulty);
        Assert.Equal("A", question.CorrectOption);
        Assert.Equal(120, result.InputTokens);
        Assert.Equal(80, result.OutputTokens);
        Assert.NotNull(handler.RequestBody);
        using var requestDocument = JsonDocument.Parse(handler.RequestBody);
        Assert.False(requestDocument.RootElement.GetProperty("store").GetBoolean());
        Assert.Equal(
            "json_schema",
            requestDocument.RootElement
                .GetProperty("text")
                .GetProperty("format")
                .GetProperty("type")
                .GetString());
        Assert.True(
            requestDocument.RootElement
                .GetProperty("text")
                .GetProperty("format")
                .GetProperty("strict")
                .GetBoolean());
    }

    [Fact]
    public async Task GenerateAsync_RejectsExcerptNotFoundInSource()
    {
        var outputPayload = JsonSerializer.Serialize(new
        {
            questions = new[]
            {
                new
                {
                    questionText = "Bu soru yeterince uzun bir soru metnidir?",
                    optionA = "A seçeneği",
                    optionB = "B seçeneği",
                    optionC = "C seçeneği",
                    optionD = "D seçeneği",
                    optionE = "",
                    correctOption = "A",
                    explanation = "Açıklama",
                    difficulty = "Easy",
                    sourcePage = 1,
                    sourceExcerpt = "Kaynakta olmayan bilgi"
                }
            }
        });
        var responsePayload = JsonSerializer.Serialize(new
        {
            status = "completed",
            output = new[]
            {
                new
                {
                    content = new[] { new { type = "output_text", text = outputPayload } }
                }
            },
            usage = new { input_tokens = 1, output_tokens = 1 }
        });
        var provider = new OpenAiQuestionProvider(
            new TestHttpClientFactory(new CapturingHandler(responsePayload)),
            Options.Create(new AiQuestionGenerationOptions
            {
                Enabled = true,
                ApiKey = "unit-test-key"
            }));
        var input = new AiQuestionGenerationInput(
            "PDF",
            "Konu",
            1,
            1,
            1,
            0,
            0,
            true,
            "--- Page 1 ---\nGerçek kaynak bilgisi");

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => provider.GenerateAsync(input));

        Assert.Contains("kaynak dayanağı", exception.Message);
    }

    private sealed class TestHttpClientFactory(HttpMessageHandler handler) : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => new(handler, disposeHandler: false);
    }

    private sealed class CapturingHandler(string responsePayload) : HttpMessageHandler
    {
        public string? RequestBody { get; private set; }

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            RequestBody = await request.Content!.ReadAsStringAsync(cancellationToken);
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(responsePayload, Encoding.UTF8, "application/json")
            };
        }
    }
}
