using System;
using System.Linq;
using System.Threading.Tasks;
using Knowledtree.Trees;
using Knowledtree.UserWallets;
using Shouldly;
using Volo.Abp;
using Volo.Abp.Domain.Repositories;
using Xunit;

namespace Knowledtree.EntityFrameworkCore.Applications;

public class TreeStoreAppServiceTests : KnowledtreeEntityFrameworkCoreTestBase
{
    private static readonly Guid CurrentUserId = Guid.Parse("2e701e62-0953-4dd3-910b-dc6cc93ccb0d");

    private readonly IStoreAppService _storeAppService;
    private readonly IPlantingSessionAppService _plantingSessionAppService;
    private readonly IAdminTreeAppService _adminTreeAppService;
    private readonly IAdminTreePoolAppService _adminTreePoolAppService;
    private readonly IRepository<UserSeedPackage, Guid> _seedPackageRepository;
    private readonly IRepository<PlantingSession, Guid> _plantingSessionRepository;
    private readonly IRepository<UserTree, Guid> _userTreeRepository;
    private readonly IRepository<UserWallet, Guid> _walletRepository;

    public TreeStoreAppServiceTests()
    {
        _storeAppService = GetRequiredService<IStoreAppService>();
        _plantingSessionAppService = GetRequiredService<IPlantingSessionAppService>();
        _adminTreeAppService = GetRequiredService<IAdminTreeAppService>();
        _adminTreePoolAppService = GetRequiredService<IAdminTreePoolAppService>();
        _seedPackageRepository = GetRequiredService<IRepository<UserSeedPackage, Guid>>();
        _plantingSessionRepository = GetRequiredService<IRepository<PlantingSession, Guid>>();
        _userTreeRepository = GetRequiredService<IRepository<UserTree, Guid>>();
        _walletRepository = GetRequiredService<IRepository<UserWallet, Guid>>();
    }

    [Fact]
    public async Task Wallet_Should_Be_Created_With_Starter_Balance()
    {
        var wallet = await _storeAppService.GetMyWalletAsync();

        wallet.Coin.ShouldBe(StoreAppService.StarterCoin);
        wallet.Gem.ShouldBe(StoreAppService.StarterGem);
    }

    [Fact]
    public async Task BuySeedPackage_Should_Debit_Wallet_And_Add_Inventory()
    {
        var (_, pool) = await CreateActivePoolAsync(cost: 100, packageImageKey: "starter_pack");

        var result = await _storeAppService.BuySeedPackageAsync(pool.Id);

        result.Wallet.Coin.ShouldBe(StoreAppService.StarterCoin - 100);
        result.SeedPackage.TreePoolId.ShouldBe(pool.Id);
        result.SeedPackage.PackageImageKey.ShouldBe("starter_pack");
        result.SeedPackage.Quantity.ShouldBe(1);

        var packages = await _storeAppService.GetMySeedPackagesAsync();
        packages.Single(x => x.TreePoolId == pool.Id).PackageImageKey.ShouldBe("starter_pack");
    }

    [Fact]
    public async Task BuySeedPackages_Should_Debit_Wallet_And_Add_Batched_Inventory()
    {
        var (_, pool) = await CreateActivePoolAsync(cost: 100, packageImageKey: "starter_pack");

        var result = await _storeAppService.BuySeedPackagesAsync(new BuySeedPackagesDto
        {
            Items =
            [
                new BuySeedPackageItemDto
                {
                    TreePoolId = pool.Id,
                    Quantity = 3
                }
            ]
        });

        result.Wallet.Coin.ShouldBe(StoreAppService.StarterCoin - 300);
        result.SeedPackages.Single().TreePoolId.ShouldBe(pool.Id);
        result.SeedPackages.Single().PackageImageKey.ShouldBe("starter_pack");
        result.SeedPackages.Single().Quantity.ShouldBe(3);

        var package = await GetSeedPackageAsync(pool.Id);
        package.Quantity.ShouldBe(3);
    }

    [Fact]
    public async Task BuySeedPackages_Should_Aggregate_Duplicate_Items()
    {
        var (_, pool) = await CreateActivePoolAsync(cost: 100);

        var result = await _storeAppService.BuySeedPackagesAsync(new BuySeedPackagesDto
        {
            Items =
            [
                new BuySeedPackageItemDto
                {
                    TreePoolId = pool.Id,
                    Quantity = 2
                },
                new BuySeedPackageItemDto
                {
                    TreePoolId = pool.Id,
                    Quantity = 3
                }
            ]
        });

        result.Wallet.Coin.ShouldBe(StoreAppService.StarterCoin - 500);
        result.SeedPackages.Single().Quantity.ShouldBe(5);

        var package = await GetSeedPackageAsync(pool.Id);
        package.Quantity.ShouldBe(5);
    }

    [Fact]
    public async Task BuySeedPackage_Should_Reject_Insufficient_Balance()
    {
        var (_, pool) = await CreateActivePoolAsync(cost: 2000);

        var exception = await Should.ThrowAsync<BusinessException>(() =>
            _storeAppService.BuySeedPackageAsync(pool.Id));

        exception.Code.ShouldBe(KnowledtreeDomainErrorCodes.InsufficientWalletBalance);
    }

    [Fact]
    public async Task BuySeedPackages_Should_Reject_When_Total_Cost_Exceeds_Balance()
    {
        var (_, pool) = await CreateActivePoolAsync(cost: 400);

        var exception = await Should.ThrowAsync<BusinessException>(() =>
            _storeAppService.BuySeedPackagesAsync(new BuySeedPackagesDto
            {
                Items =
                [
                    new BuySeedPackageItemDto
                    {
                        TreePoolId = pool.Id,
                        Quantity = 3
                    }
                ]
            }));

        exception.Code.ShouldBe(KnowledtreeDomainErrorCodes.InsufficientWalletBalance);

        var packages = await _storeAppService.GetMySeedPackagesAsync();
        packages.Any(x => x.TreePoolId == pool.Id).ShouldBeFalse();
    }

    [Fact]
    public async Task BuySeedPackage_Should_Reject_Inactive_Pool()
    {
        var tree = await CreateTreeAsync(TreeRarity.Common);
        var pool = await CreatePoolAsync(isActive: false, cost: 100);
        await _adminTreePoolAppService.ReplaceItemsAsync(pool.Id, new ReplaceTreePoolItemsDto { TreeIds = [tree.Id] });

        var exception = await Should.ThrowAsync<BusinessException>(() =>
            _storeAppService.BuySeedPackageAsync(pool.Id));

        exception.Code.ShouldBe(KnowledtreeDomainErrorCodes.TreePoolUnavailable);
    }

    [Fact]
    public async Task Start_Should_Consume_SeedPackage()
    {
        var (_, pool) = await CreateActivePoolAsync(cost: 100);
        await _storeAppService.BuySeedPackageAsync(pool.Id);

        var session = await _plantingSessionAppService.StartAsync(new StartPlantingSessionDto
        {
            TreePoolId = pool.Id,
            PlannedDurationMinutes = 30
        });

        session.Status.ShouldBe(PlantingSessionStatus.Growing);
        var package = await GetSeedPackageAsync(pool.Id);
        package.Quantity.ShouldBe(0);
    }

    [Fact]
    public async Task Start_Should_Reject_When_Active_Session_Exists()
    {
        var (_, pool) = await CreateActivePoolAsync(cost: 100);
        await _storeAppService.BuySeedPackageAsync(pool.Id);
        await _storeAppService.BuySeedPackageAsync(pool.Id);
        await _plantingSessionAppService.StartAsync(new StartPlantingSessionDto
        {
            TreePoolId = pool.Id,
            PlannedDurationMinutes = 30
        });

        var exception = await Should.ThrowAsync<BusinessException>(() =>
            _plantingSessionAppService.StartAsync(new StartPlantingSessionDto
            {
                TreePoolId = pool.Id,
                PlannedDurationMinutes = 30
            }));

        exception.Code.ShouldBe(KnowledtreeDomainErrorCodes.ActivePlantingSessionAlreadyExists);
    }

    [Fact]
    public async Task Complete_Should_Award_New_Tree()
    {
        var (tree, pool) = await CreateActivePoolAsync(cost: 100);
        var session = await CreateReadySessionAsync(pool.Id);

        var result = await _plantingSessionAppService.CompleteAsync(
            session.Id,
            new CompletePlantingSessionDto { ClientEndTime = DateTime.Now });

        result.IsDuplicate.ShouldBeFalse();
        result.ResultTree.Id.ShouldBe(tree.Id);
        result.TotalObtainedCount.ShouldBe(1);
        result.Session.Status.ShouldBe(PlantingSessionStatus.Claimed);
    }

    [Fact]
    public async Task Complete_Should_Increment_Common_Duplicate_And_Credit_Coins()
    {
        var (tree, pool) = await CreateActivePoolAsync(cost: 100);
        var initialWallet = await _storeAppService.GetMyWalletAsync();

        await WithUnitOfWorkAsync(async () =>
        {
            await _userTreeRepository.InsertAsync(new UserTree(
                Guid.NewGuid(),
                CurrentUserId,
                tree.Id,
                pool.Id,
                DateTime.Now.AddDays(-1)));
        });

        var session = await CreateReadySessionAsync(pool.Id);

        var result = await _plantingSessionAppService.CompleteAsync(
            session.Id,
            new CompletePlantingSessionDto { ClientEndTime = DateTime.Now });

        result.IsDuplicate.ShouldBeTrue();
        result.TotalObtainedCount.ShouldBe(2);
        result.Session.DuplicateGemReward.ShouldBe(0);
        result.Session.DuplicateCoinReward.ShouldBe(200);
        result.BonusGemReward.ShouldBe(0);
        result.BonusCoinReward.ShouldBe(200);
        result.Wallet.Coin.ShouldBe(initialWallet.Coin + 200);
        result.Wallet.Gem.ShouldBe(initialWallet.Gem);
    }

    [Fact]
    public async Task GetMyTrees_Should_Return_Owned_Tree_Counts()
    {
        var (tree, pool) = await CreateActivePoolAsync(cost: 100);

        await WithUnitOfWorkAsync(async () =>
        {
            var userTree = new UserTree(
                Guid.NewGuid(),
                CurrentUserId,
                tree.Id,
                pool.Id,
                DateTime.Now.AddDays(-1));
            userTree.IncrementObtainedCount();

            await _userTreeRepository.InsertAsync(userTree);
        });

        var trees = await _storeAppService.GetMyTreesAsync();
        var ownedTree = trees.Single(x => x.Tree.Id == tree.Id);

        ownedTree.Tree.Name.ShouldBe(tree.Name);
        ownedTree.TotalObtainedCount.ShouldBe(2);
    }

    private async Task<(TreeDto Tree, TreePoolDto Pool)> CreateActivePoolAsync(
        int cost,
        string? packageImageKey = null)
    {
        var tree = await CreateTreeAsync(TreeRarity.Common);
        var pool = await CreatePoolAsync(isActive: false, cost: cost, packageImageKey: packageImageKey);
        await _adminTreePoolAppService.ReplaceItemsAsync(pool.Id, new ReplaceTreePoolItemsDto { TreeIds = [tree.Id] });
        pool = await _adminTreePoolAppService.UpdateAsync(
            pool.Id,
            CreatePoolInput(isActive: true, cost: cost, packageImageKey: packageImageKey));
        return (tree, pool);
    }

    private Task<TreeDto> CreateTreeAsync(TreeRarity rarity)
    {
        var suffix = Guid.NewGuid().ToString("N")[..8];
        return _adminTreeAppService.CreateAsync(new CreateUpdateTreeDto
        {
            Name = $"Tree {suffix}",
            Description = "Test tree",
            Rarity = rarity,
            ImageKey = $"tree-{suffix}",
            BaseGoldYield = 1
        });
    }

    private Task<TreePoolDto> CreatePoolAsync(bool isActive, int cost, string? packageImageKey = null)
    {
        return _adminTreePoolAppService.CreateAsync(CreatePoolInput(isActive, cost, packageImageKey));
    }

    private CreateUpdateTreePoolDto CreatePoolInput(bool isActive, int cost, string? packageImageKey = null)
    {
        return new CreateUpdateTreePoolDto
        {
            Name = $"Pool {Guid.NewGuid():N}",
            PoolType = TreePoolType.Permanent,
            CurrencyType = CurrencyType.Gold,
            Cost = cost,
            CommonRate = 100m,
            RareRate = 0m,
            GoldRate = 0m,
            IsActive = isActive,
            PackageImageKey = packageImageKey
        };
    }

    private async Task<UserSeedPackage> GetSeedPackageAsync(int treePoolId)
    {
        return await WithUnitOfWorkAsync(async () =>
        {
            var packages = await _seedPackageRepository.GetListAsync();
            return packages.Single(x => x.UserId == CurrentUserId && x.TreePoolId == treePoolId);
        });
    }

    private async Task<PlantingSession> CreateReadySessionAsync(int treePoolId)
    {
        return await WithUnitOfWorkAsync(async () =>
        {
            var startTime = DateTime.Now.AddMinutes(-5);
            var session = new PlantingSession(
                Guid.NewGuid(),
                CurrentUserId,
                treePoolId,
                tagId: null,
                plannedDurationMinutes: 1,
                clientStartTime: startTime,
                serverStartTime: startTime);

            return await _plantingSessionRepository.InsertAsync(session, autoSave: true);
        });
    }
}
