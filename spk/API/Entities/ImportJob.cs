namespace API.Entities;

public class ImportJob : BaseEntity
{
    public string FileName { get; set; } = string.Empty;

    public ImportType ImportType { get; set; }

    public ImportJobStatus Status { get; set; } = ImportJobStatus.Pending;

    public int TotalRows { get; set; }

    public int SuccessfulRows { get; set; }

    public int FailedRows { get; set; }

    public DateTime? StartedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    public string CreatedByUserId { get; set; } = string.Empty;

    public AppUser? CreatedByUser { get; set; }

    public string? ErrorReportUrl { get; set; }

    public string? StoredFilePath { get; set; }

    public string? Summary { get; set; }

    public ICollection<ImportError> Errors { get; set; } = new List<ImportError>();
}
