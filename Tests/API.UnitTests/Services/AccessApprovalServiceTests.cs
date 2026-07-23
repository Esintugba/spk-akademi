using API.Data;
using API.Entities;
using API.Services;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace API.UnitTests.Services;

public class AccessApprovalServiceTests
{
    [Fact]
    public async Task RevokePlanAccess_RemovesAccessCreatedByApproval()
    {
        await using var fixture = await Fixture.CreateAsync();

        await fixture.Service.GrantPlanAccessAsync(fixture.Request);
        await fixture.Context.SaveChangesAsync();

        var grantedAccess = await fixture.Context.UserLicenseAccesses.SingleAsync();
        Assert.Equal(AccessSource.Beta, grantedAccess.AccessSource);
        Assert.True(grantedAccess.IsActive);

        var request = await fixture.LoadRequestAsync();
        var result = await fixture.Service.RevokePlanAccessAsync(request);
        await fixture.Context.SaveChangesAsync();

        Assert.Equal(AccessApprovalReversalResult.Success, result);
        Assert.Empty(await fixture.Context.UserLicenseAccesses.ToListAsync());
        Assert.NotNull(request.AccessGrants.Single().RevertedAt);
    }

    [Fact]
    public async Task RevokePlanAccess_RestoresPreexistingAccess()
    {
        await using var fixture = await Fixture.CreateAsync();
        var originalStart = DateTime.UtcNow.AddDays(-30);
        var originalEnd = DateTime.UtcNow.AddDays(10);
        var existing = new UserLicenseAccess
        {
            UserId = fixture.User.Id,
            LicenseId = fixture.License.Id,
            StartDate = originalStart,
            EndDate = originalEnd,
            IsActive = false,
            AccessSource = AccessSource.Admin
        };
        fixture.Context.UserLicenseAccesses.Add(existing);
        await fixture.Context.SaveChangesAsync();

        await fixture.Service.GrantPlanAccessAsync(fixture.Request);
        await fixture.Context.SaveChangesAsync();

        var request = await fixture.LoadRequestAsync();
        var result = await fixture.Service.RevokePlanAccessAsync(request);
        await fixture.Context.SaveChangesAsync();

        var restored = await fixture.Context.UserLicenseAccesses.SingleAsync();
        Assert.Equal(AccessApprovalReversalResult.Success, result);
        Assert.Equal(originalStart, restored.StartDate);
        Assert.Equal(originalEnd, restored.EndDate);
        Assert.False(restored.IsActive);
        Assert.Equal(AccessSource.Admin, restored.AccessSource);
    }

    [Fact]
    public async Task RevokePlanAccess_StopsWhenAccessWasChangedAfterApproval()
    {
        await using var fixture = await Fixture.CreateAsync();

        await fixture.Service.GrantPlanAccessAsync(fixture.Request);
        await fixture.Context.SaveChangesAsync();

        var access = await fixture.Context.UserLicenseAccesses.SingleAsync();
        access.IsActive = false;
        access.UpdatedAt = DateTime.UtcNow.AddSeconds(1);
        await fixture.Context.SaveChangesAsync();

        var request = await fixture.LoadRequestAsync();
        var result = await fixture.Service.RevokePlanAccessAsync(request);

        Assert.Equal(AccessApprovalReversalResult.AccessChangedSinceApproval, result);
        Assert.Single(await fixture.Context.UserLicenseAccesses.ToListAsync());
        Assert.Null(request.AccessGrants.Single().RevertedAt);
    }

    [Fact]
    public async Task RevokePlanAccess_StopsWhenDeletedAccessWasReplaced()
    {
        await using var fixture = await Fixture.CreateAsync();

        await fixture.Service.GrantPlanAccessAsync(fixture.Request);
        await fixture.Context.SaveChangesAsync();

        var grantedAccess = await fixture.Context.UserLicenseAccesses.SingleAsync();
        fixture.Context.UserLicenseAccesses.Remove(grantedAccess);
        await fixture.Context.SaveChangesAsync();

        fixture.Context.UserLicenseAccesses.Add(new UserLicenseAccess
        {
            UserId = fixture.User.Id,
            LicenseId = fixture.License.Id,
            IsActive = true,
            AccessSource = AccessSource.Admin
        });
        await fixture.Context.SaveChangesAsync();

        var request = await fixture.LoadRequestAsync();
        var result = await fixture.Service.RevokePlanAccessAsync(request);

        Assert.Equal(AccessApprovalReversalResult.AccessChangedSinceApproval, result);
        Assert.Single(await fixture.Context.UserLicenseAccesses.ToListAsync());
        Assert.Null(request.AccessGrants.Single().RevertedAt);
    }

    private sealed class Fixture : IAsyncDisposable
    {
        private readonly SqliteConnection connection;

        private Fixture(
            SqliteConnection connection,
            DataContext context,
            AppUser user,
            License license,
            AccessRequest request)
        {
            this.connection = connection;
            Context = context;
            User = user;
            License = license;
            Request = request;
            Service = new AccessApprovalService(context);
        }

        public DataContext Context { get; }

        public AppUser User { get; }

        public License License { get; }

        public AccessRequest Request { get; }

        public AccessApprovalService Service { get; }

        public static async Task<Fixture> CreateAsync()
        {
            var connection = new SqliteConnection("Data Source=:memory:");
            await connection.OpenAsync();

            var options = new DbContextOptionsBuilder<DataContext>()
                .UseSqlite(connection)
                .Options;
            var context = new DataContext(options);
            await context.Database.EnsureCreatedAsync();

            var user = new AppUser
            {
                Id = Guid.NewGuid().ToString(),
                Email = "student@example.com",
                UserName = "student@example.com",
                DisplayName = "Student"
            };
            var license = new License { Name = "Test License", Slug = $"license-{Guid.NewGuid():N}" };
            var plan = new Plan { Name = "Test Plan", Slug = $"plan-{Guid.NewGuid():N}" };
            var request = new AccessRequest
            {
                StudentId = user.Id,
                Student = user,
                PlanId = plan.Id,
                Plan = plan,
                Status = AccessRequestStatus.Approved
            };

            context.AddRange(user, license, plan, request);
            context.PlanLicenses.Add(new PlanLicense
            {
                PlanId = plan.Id,
                LicenseId = license.Id
            });
            await context.SaveChangesAsync();

            return new Fixture(connection, context, user, license, request);
        }

        public async Task<AccessRequest> LoadRequestAsync()
        {
            Context.ChangeTracker.Clear();
            return await Context.AccessRequests
                .Include(x => x.AccessGrants)
                .SingleAsync(x => x.Id == Request.Id);
        }

        public async ValueTask DisposeAsync()
        {
            await Context.DisposeAsync();
            await connection.DisposeAsync();
        }
    }
}
