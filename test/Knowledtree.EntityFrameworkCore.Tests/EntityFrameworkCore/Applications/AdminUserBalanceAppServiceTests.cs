using System;
using System.Linq;
using System.Threading.Tasks;
using Knowledtree.Trees;
using Knowledtree.Users;
using Shouldly;
using Volo.Abp.Validation;
using Xunit;

namespace Knowledtree.EntityFrameworkCore.Applications;

public class AdminUserBalanceAppServiceTests : KnowledtreeEntityFrameworkCoreTestBase
{
    private static readonly Guid CurrentUserId =
        Guid.Parse("2e701e62-0953-4dd3-910b-dc6cc93ccb0d");

    private readonly IAdminUserBalanceAppService _adminUserBalanceAppService;
    private readonly IAdminTreePoolAppService _adminTreePoolAppService;

    public AdminUserBalanceAppServiceTests()
    {
        _adminUserBalanceAppService =
            GetRequiredService<IAdminUserBalanceAppService>();
        _adminTreePoolAppService = GetRequiredService<IAdminTreePoolAppService>();
    }

    [Fact]
    public async Task Admin_Should_Update_Wallet_And_Manage_Seed_Package()
    {
        var walletResult = await _adminUserBalanceAppService.UpdateWalletAsync(
            CurrentUserId,
            new UpdateUserWalletDto
            {
                Coin = 4321,
                Gem = 321
            });

        walletResult.Wallet.Coin.ShouldBe(4321);
        walletResult.Wallet.Gem.ShouldBe(321);

        var pool = await _adminTreePoolAppService.CreateAsync(
            new CreateUpdateTreePoolDto
            {
                Name = $"Balance Test Pool {Guid.NewGuid():N}",
                PoolType = TreePoolType.Permanent,
                CurrencyType = CurrencyType.Gold,
                Cost = 100,
                CommonRate = 100m,
                RareRate = 0m,
                GoldRate = 0m,
                IsActive = false
            });

        var withPackage = await _adminUserBalanceAppService.UpsertSeedPackageAsync(
            CurrentUserId,
            new UpsertUserSeedPackageDto
            {
                TreePoolId = pool.Id,
                Quantity = 3
            });
        withPackage.SeedPackages.Single(x => x.TreePoolId == pool.Id)
            .Quantity.ShouldBe(3);

        var withoutPackage =
            await _adminUserBalanceAppService.DeleteSeedPackageAsync(
                CurrentUserId,
                pool.Id);
        withoutPackage.SeedPackages.ShouldNotContain(x => x.TreePoolId == pool.Id);
    }

    [Fact]
    public async Task UpdateWallet_Should_Reject_Negative_Balance()
    {
        var exception = await Should.ThrowAsync<AbpValidationException>(() =>
            _adminUserBalanceAppService.UpdateWalletAsync(
                CurrentUserId,
                new UpdateUserWalletDto
                {
                    Coin = -1,
                    Gem = 0
                }));

        exception.ValidationErrors
            .Any(error =>
                error.MemberNames.Contains(nameof(UpdateUserWalletDto.Coin)))
            .ShouldBeTrue();
    }
}
