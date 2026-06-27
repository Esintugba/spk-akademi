using API.Services;
using Microsoft.AspNetCore.Authorization;

namespace API.Authorization;

public static class AuthorizationPolicies
{
    public const string StudentOnly = nameof(StudentOnly);

    public static void AddAppAuthorizationPolicies(this AuthorizationOptions options)
    {
        options.AddPolicy(StudentOnly, policy =>
            policy.RequireRole(AppRoles.Student));
    }
}
