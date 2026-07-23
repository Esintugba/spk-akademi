using API.Data;
using API.Entities;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace API.UnitTests.Services;

public class AccessRequestPersistenceTests
{
    [Fact]
    public async Task PendingRequest_CanBeUpdatedAndHistoryCanBeAdded_AfterSqliteMigrations()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();

        var options = new DbContextOptionsBuilder<DataContext>()
            .UseSqlite(connection)
            .ConfigureWarnings(warnings => warnings.Ignore(RelationalEventId.PendingModelChangesWarning))
            .Options;

        await using var context = new DataContext(options);
        await context.Database.MigrateAsync();

        var student = new AppUser
        {
            Id = Guid.NewGuid().ToString(),
            Email = "student@example.com",
            UserName = "student@example.com",
            DisplayName = "Student"
        };
        var admin = new AppUser
        {
            Id = Guid.NewGuid().ToString(),
            Email = "admin@example.com",
            UserName = "admin@example.com",
            DisplayName = "Admin"
        };
        var plan = new Plan
        {
            Name = "Test Plan",
            Slug = $"test-plan-{Guid.NewGuid():N}"
        };
        var request = new AccessRequest
        {
            StudentId = student.Id,
            PlanId = plan.Id,
            Status = AccessRequestStatus.Pending
        };

        context.AddRange(student, admin, plan, request);
        await context.SaveChangesAsync();
        context.ChangeTracker.Clear();

        var loaded = await context.AccessRequests
            .Include(x => x.Student)
            .Include(x => x.Plan)
            .Include(x => x.ReviewedBy)
            .Include(x => x.History)
                .ThenInclude(x => x.ChangedBy)
            .Include(x => x.AccessGrants)
            .SingleAsync(x => x.Id == request.Id);

        var now = DateTime.UtcNow;
        loaded.Status = AccessRequestStatus.Waitlisted;
        loaded.ReviewedAt = now;
        loaded.ReviewedByUserId = admin.Id;
        loaded.UpdatedAt = now;
        context.AccessRequestHistories.Add(new AccessRequestHistory
        {
            AccessRequestId = loaded.Id,
            AccessRequest = loaded,
            FromStatus = AccessRequestStatus.Pending,
            ToStatus = AccessRequestStatus.Waitlisted,
            ChangedByUserId = admin.Id,
            ChangedAt = now
        });

        await context.SaveChangesAsync();
        context.ChangeTracker.Clear();

        var persisted = await context.AccessRequests
            .Include(x => x.History)
            .SingleAsync(x => x.Id == request.Id);

        Assert.Equal(AccessRequestStatus.Waitlisted, persisted.Status);
        Assert.Equal(admin.Id, persisted.ReviewedByUserId);
        Assert.Single(persisted.History);
    }
}
