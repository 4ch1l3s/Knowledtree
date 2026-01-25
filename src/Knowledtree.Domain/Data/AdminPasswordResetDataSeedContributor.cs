using System;
using System.Threading.Tasks;
using Volo.Abp.Data;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Identity;
using Volo.Abp.Guids;

namespace Knowledtree.Data;

public class AdminPasswordResetDataSeedContributor : IDataSeedContributor, ITransientDependency
{
    private readonly IdentityUserManager _userManager;

    public AdminPasswordResetDataSeedContributor(
        IdentityUserManager userManager)
    {
        _userManager = userManager;
    }

    public async Task SeedAsync(DataSeedContext context)
    {
        var adminUser = await _userManager.FindByNameAsync("admin");
        if (adminUser != null)
        {
            // Remove existing password if any
            if (await _userManager.HasPasswordAsync(adminUser))
            {
                await _userManager.RemovePasswordAsync(adminUser);
            }

            // Set new password
            var result = await _userManager.AddPasswordAsync(adminUser, "Vu050739@");
            
            if (!result.Succeeded)
            {
               throw new Exception("Failed to reset admin password: " + string.Join(", ", result.Errors));
            }
        }
    }
}
