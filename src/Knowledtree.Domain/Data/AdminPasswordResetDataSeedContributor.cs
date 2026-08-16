using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Volo.Abp.Data;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Identity;

namespace Knowledtree.Data;

public class AdminPasswordResetDataSeedContributor : IDataSeedContributor, ITransientDependency
{
    private readonly IdentityUserManager _userManager;
    private readonly IConfiguration _configuration;

    public AdminPasswordResetDataSeedContributor(
        IdentityUserManager userManager,
        IConfiguration configuration)
    {
        _userManager = userManager;
        _configuration = configuration;
    }

    public async Task SeedAsync(DataSeedContext context)
    {
        if (!_configuration.GetValue<bool>("AdminPasswordReset:Enabled"))
        {
            return;
        }

        var newPassword = _configuration["AdminPasswordReset:Password"];
        if (string.IsNullOrWhiteSpace(newPassword))
        {
            throw new InvalidOperationException(
                "AdminPasswordReset:Password must be configured when admin password reset is enabled.");
        }

        var adminUser = await _userManager.FindByNameAsync("admin");
        if (adminUser != null)
        {
            // Remove existing password if any
            if (await _userManager.HasPasswordAsync(adminUser))
            {
                await _userManager.RemovePasswordAsync(adminUser);
            }

            // Set new password
            var result = await _userManager.AddPasswordAsync(adminUser, newPassword);
            
            if (!result.Succeeded)
            {
               throw new Exception("Failed to reset admin password: " + string.Join(", ", result.Errors));
            }
        }
    }
}
