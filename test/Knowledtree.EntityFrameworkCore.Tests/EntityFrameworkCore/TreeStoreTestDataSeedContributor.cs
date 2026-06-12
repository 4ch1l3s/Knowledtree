using System;
using System.Threading.Tasks;
using Volo.Abp.Data;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Identity;

namespace Knowledtree.EntityFrameworkCore;

public class TreeStoreTestDataSeedContributor : IDataSeedContributor, ITransientDependency
{
    private static readonly Guid TestUserId = Guid.Parse("2e701e62-0953-4dd3-910b-dc6cc93ccb0d");

    private readonly IdentityUserManager _userManager;

    public TreeStoreTestDataSeedContributor(IdentityUserManager userManager)
    {
        _userManager = userManager;
    }

    public async Task SeedAsync(DataSeedContext context)
    {
        if (await _userManager.FindByIdAsync(TestUserId.ToString()) != null)
        {
            return;
        }

        var testUser = new IdentityUser(TestUserId, "test-user", "test-user@abp.io");
        await _userManager.CreateAsync(testUser);
    }
}
