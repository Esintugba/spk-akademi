using System.Globalization;
using System.IO.Compression;
using System.Text;
using System.Text.Json;
using System.Xml.Linq;
using API.Dtos;

namespace API.Services;

public interface IImportFileParser
{
    Task<IReadOnlyList<QuestionImportRowDto>> ParseQuestionRowsAsync(
        IFormFile file,
        CancellationToken cancellationToken = default);
}

public class ImportFileParser : IImportFileParser
{
    public async Task<IReadOnlyList<QuestionImportRowDto>> ParseQuestionRowsAsync(
        IFormFile file,
        CancellationToken cancellationToken = default)
    {
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        await using var stream = file.OpenReadStream();

        return extension switch
        {
            ".csv" => await ParseCsvAsync(stream, cancellationToken),
            ".json" => await ParseJsonAsync(stream, cancellationToken),
            ".xlsx" => ParseXlsx(stream),
            _ => throw new NotSupportedException("Desteklenmeyen dosya formatı. XLSX, CSV veya JSON yükleyin.")
        };
    }

    private static async Task<IReadOnlyList<QuestionImportRowDto>> ParseJsonAsync(
        Stream stream,
        CancellationToken cancellationToken)
    {
        var rows = await JsonSerializer.DeserializeAsync<List<QuestionImportRowDto>>(
            stream,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true },
            cancellationToken);

        return rows?.Select((row, index) => row with { RowNumber = row.RowNumber > 0 ? row.RowNumber : index + 2 }).ToList()
            ?? [];
    }

    private static async Task<IReadOnlyList<QuestionImportRowDto>> ParseCsvAsync(
        Stream stream,
        CancellationToken cancellationToken)
    {
        using var reader = new StreamReader(stream, Encoding.UTF8, detectEncodingFromByteOrderMarks: true);
        var headerLine = await reader.ReadLineAsync(cancellationToken);
        if (headerLine is null)
        {
            return [];
        }

        var headers = BuildHeaderIndex(SplitCsvLine(headerLine));

        var rows = new List<QuestionImportRowDto>();
        var rowNumber = 1;
        string? line;
        while ((line = await reader.ReadLineAsync(cancellationToken)) is not null)
        {
            cancellationToken.ThrowIfCancellationRequested();
            rowNumber++;
            if (string.IsNullOrWhiteSpace(line))
            {
                continue;
            }

            var cells = SplitCsvLine(line);
            rows.Add(MapQuestionRow(rowNumber, headers, cells));
        }

        return rows;
    }

    private static IReadOnlyList<QuestionImportRowDto> ParseXlsx(Stream stream)
    {
        using var archive = new ZipArchive(stream, ZipArchiveMode.Read, leaveOpen: false);
        var sheetEntry = archive.GetEntry("xl/worksheets/sheet1.xml")
            ?? throw new InvalidOperationException("XLSX icinde ilk calisma sayfasi bulunamadi.");

        var sharedStrings = ReadSharedStrings(archive);
        using var sheetStream = sheetEntry.Open();
        var document = XDocument.Load(sheetStream);
        XNamespace spreadsheet = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";

        var rows = document.Descendants(spreadsheet + "row")
            .Select(row => new
            {
                Number = int.TryParse(row.Attribute("r")?.Value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var number)
                    ? number
                    : 0,
                Cells = ReadXlsxRow(row, spreadsheet, sharedStrings)
            })
            .Where(row => row.Cells.Any(cell => !string.IsNullOrWhiteSpace(cell)))
            .ToList();

        if (rows.Count == 0)
        {
            return [];
        }

        var headers = BuildHeaderIndex(rows[0].Cells);
        return rows
            .Skip(1)
            .Select(row => MapQuestionRow(row.Number > 0 ? row.Number : rows.IndexOf(row) + 1, headers, row.Cells))
            .ToList();
    }

    private static List<string> ReadSharedStrings(ZipArchive archive)
    {
        var entry = archive.GetEntry("xl/sharedStrings.xml");
        if (entry is null)
        {
            return [];
        }

        using var stream = entry.Open();
        var document = XDocument.Load(stream);
        XNamespace spreadsheet = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";

        return document.Descendants(spreadsheet + "si")
            .Select(item => string.Concat(item.Descendants(spreadsheet + "t").Select(text => text.Value)))
            .ToList();
    }

    private static List<string> ReadXlsxRow(
        XElement row,
        XNamespace spreadsheet,
        IReadOnlyList<string> sharedStrings)
    {
        var values = new SortedDictionary<int, string>();

        foreach (var cell in row.Elements(spreadsheet + "c"))
        {
            var columnIndex = GetColumnIndex(cell.Attribute("r")?.Value);
            var value = ReadXlsxCellValue(cell, spreadsheet, sharedStrings);
            values[columnIndex] = value;
        }

        if (values.Count == 0)
        {
            return [];
        }

        var cells = Enumerable.Repeat(string.Empty, values.Keys.Max() + 1).ToList();
        foreach (var (index, value) in values)
        {
            cells[index] = value;
        }

        return cells;
    }

    private static string ReadXlsxCellValue(
        XElement cell,
        XNamespace spreadsheet,
        IReadOnlyList<string> sharedStrings)
    {
        var type = cell.Attribute("t")?.Value;
        if (type == "inlineStr")
        {
            return string.Concat(cell.Descendants(spreadsheet + "t").Select(text => text.Value));
        }

        var rawValue = cell.Element(spreadsheet + "v")?.Value ?? string.Empty;
        if (type == "s"
            && int.TryParse(rawValue, NumberStyles.Integer, CultureInfo.InvariantCulture, out var sharedStringIndex)
            && sharedStringIndex >= 0
            && sharedStringIndex < sharedStrings.Count)
        {
            return sharedStrings[sharedStringIndex];
        }

        return rawValue;
    }

    private static int GetColumnIndex(string? cellReference)
    {
        if (string.IsNullOrWhiteSpace(cellReference))
        {
            return 0;
        }

        var index = 0;
        foreach (var ch in cellReference)
        {
            if (!char.IsLetter(ch))
            {
                break;
            }

            index = (index * 26) + char.ToUpperInvariant(ch) - 'A' + 1;
        }

        return Math.Max(index - 1, 0);
    }

    private static Dictionary<string, int> BuildHeaderIndex(IReadOnlyList<string> headers) =>
        headers
            .Select((name, index) => new { Name = NormalizeHeader(name), Index = index })
            .Where(x => !string.IsNullOrWhiteSpace(x.Name))
            .GroupBy(x => x.Name)
            .ToDictionary(x => x.Key, x => x.First().Index);

    private static QuestionImportRowDto MapQuestionRow(
        int rowNumber,
        IReadOnlyDictionary<string, int> headers,
        IReadOnlyList<string> cells)
    {
        string? Cell(string name) => headers.TryGetValue(NormalizeHeader(name), out var index) && index < cells.Count
            ? cells[index].Trim()
            : null;

        return new QuestionImportRowDto(
            rowNumber,
            Cell("QuestionText") ?? string.Empty,
            Cell("OptionA"),
            Cell("OptionB"),
            Cell("OptionC"),
            Cell("OptionD"),
            Cell("OptionE"),
            Cell("CorrectOption") ?? string.Empty,
            Cell("Explanation"),
            Cell("Topic") ?? string.Empty,
            Cell("Course") ?? string.Empty,
            Cell("Difficulty"),
            int.TryParse(Cell("ExamYear"), NumberStyles.Integer, CultureInfo.InvariantCulture, out var year) ? year : null,
            Cell("ExamType"));
    }

    private static string NormalizeHeader(string value) =>
        value.Trim().Replace(" ", string.Empty, StringComparison.Ordinal).ToLowerInvariant();

    private static List<string> SplitCsvLine(string line)
    {
        var result = new List<string>();
        var current = new StringBuilder();
        var inQuotes = false;

        for (var i = 0; i < line.Length; i++)
        {
            var ch = line[i];
            if (ch == '"')
            {
                if (inQuotes && i + 1 < line.Length && line[i + 1] == '"')
                {
                    current.Append('"');
                    i++;
                }
                else
                {
                    inQuotes = !inQuotes;
                }
            }
            else if (ch == ',' && !inQuotes)
            {
                result.Add(current.ToString());
                current.Clear();
            }
            else
            {
                current.Append(ch);
            }
        }

        result.Add(current.ToString());
        return result;
    }
}
