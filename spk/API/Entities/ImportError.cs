namespace API.Entities;

public class ImportError : BaseEntity
{
    public Guid ImportJobId { get; set; }

    public ImportJob? ImportJob { get; set; }

    public int RowNumber { get; set; }

    public string? ColumnName { get; set; }

    public string ErrorMessage { get; set; } = string.Empty;

    public string? RawData { get; set; }
}
