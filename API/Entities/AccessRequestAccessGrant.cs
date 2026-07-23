namespace API.Entities;

public class AccessRequestAccessGrant : BaseEntity
{
    public Guid AccessRequestId { get; set; }

    public AccessRequest? AccessRequest { get; set; }

    public Guid LicenseId { get; set; }

    public Guid UserLicenseAccessId { get; set; }

    public bool WasCreated { get; set; }

    public DateTime? PreviousStartDate { get; set; }

    public DateTime? PreviousEndDate { get; set; }

    public bool? PreviousIsActive { get; set; }

    public AccessSource? PreviousAccessSource { get; set; }

    public bool? PreviousIsDemoAccess { get; set; }

    public bool? PreviousGrantedAutomatically { get; set; }

    public DateTime? PreviousExpiresAt { get; set; }

    public DateTime AppliedStartDate { get; set; }

    public DateTime? AppliedEndDate { get; set; }

    public bool AppliedIsActive { get; set; }

    public AccessSource AppliedAccessSource { get; set; }

    public bool AppliedIsDemoAccess { get; set; }

    public bool AppliedGrantedAutomatically { get; set; }

    public DateTime? AppliedExpiresAt { get; set; }

    public DateTime AppliedAt { get; set; }

    public DateTime? RevertedAt { get; set; }
}
