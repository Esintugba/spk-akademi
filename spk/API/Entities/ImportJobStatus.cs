namespace API.Entities;

public enum ImportJobStatus
{
    Pending = 0,
    Processing = 1,
    Completed = 2,
    Failed = 3,
    PartiallyCompleted = 4
}
