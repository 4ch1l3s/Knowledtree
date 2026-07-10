using System;
using System.Linq;
using System.Threading.Tasks;
using Knowledtree.Tags;
using Knowledtree.Trees;
using Knowledtree.UserWallets;
using Shouldly;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Validation;
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
    private readonly ITagAppService _tagAppService;
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
        _tagAppService = GetRequiredService<ITagAppService>();
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
        session.PlannedDurationMinutes.ShouldBe(30);
        session.RequiredFocusDurationSeconds.ShouldBe(10);
        var package = await GetSeedPackageAsync(pool.Id);
        package.Quantity.ShouldBe(0);
    }

    [Fact]
    public async Task Start_Should_Allow_Owned_SeedPackage_After_Pool_Window_Ends()
    {
        var (_, pool) = await CreateActivePoolAsync(cost: 100);
        await _storeAppService.BuySeedPackageAsync(pool.Id);
        await _adminTreePoolAppService.UpdateAsync(pool.Id, new CreateUpdateTreePoolDto
        {
            Name = pool.Name,
            PoolType = pool.PoolType,
            CurrencyType = pool.CurrencyType,
            Cost = pool.Cost,
            CommonRate = pool.CommonRate,
            RareRate = pool.RareRate,
            GoldRate = pool.GoldRate,
            StartTime = DateTime.Now.AddDays(-2),
            EndTime = DateTime.Now.AddDays(-1),
            IsActive = true,
            PackageImageKey = pool.PackageImageKey
        });

        var session = await _plantingSessionAppService.StartAsync(new StartPlantingSessionDto
        {
            TreePoolId = pool.Id,
            PlannedDurationMinutes = 30
        });

        session.Status.ShouldBe(PlantingSessionStatus.Growing);
        var package = await GetSeedPackageAsync(pool.Id);
        package.Quantity.ShouldBe(0);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(29)]
    [InlineData(181)]
    public async Task Start_Should_Reject_Duration_Outside_Thirty_To_OneHundredEighty_Minutes(
        int plannedDurationMinutes)
    {
        var exception = await Should.ThrowAsync<AbpValidationException>(() =>
            _plantingSessionAppService.StartAsync(new StartPlantingSessionDto
            {
                TreePoolId = 1,
                PlannedDurationMinutes = plannedDurationMinutes
            }));

        exception.ValidationErrors
            .Any(error => error.MemberNames.Contains(nameof(StartPlantingSessionDto.PlannedDurationMinutes)))
            .ShouldBeTrue();
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
    public async Task Fail_Should_End_Active_Session_Without_Reward_Or_Seed_Refund()
    {
        var (tree, pool) = await CreateActivePoolAsync(cost: 100);
        await _storeAppService.BuySeedPackageAsync(pool.Id);
        var session = await _plantingSessionAppService.StartAsync(new StartPlantingSessionDto
        {
            TreePoolId = pool.Id,
            PlannedDurationMinutes = 30
        });

        var failedSession = await _plantingSessionAppService.FailAsync(
            session.Id,
            new FailPlantingSessionDto { ClientEndTime = DateTime.Now });

        failedSession.Status.ShouldBe(PlantingSessionStatus.Failed);
        failedSession.ServerEndTime.ShouldNotBeNull();
        (await _plantingSessionAppService.GetActiveAsync()).ShouldBeNull();
        (await GetSeedPackageAsync(pool.Id)).Quantity.ShouldBe(0);
        await WithUnitOfWorkAsync(async () =>
        {
            var userTrees = await _userTreeRepository.GetListAsync();
            userTrees.Any(x => x.UserId == CurrentUserId && x.TreeId == tree.Id).ShouldBeFalse();
        });

        var exception = await Should.ThrowAsync<BusinessException>(() =>
            _plantingSessionAppService.CompleteAsync(
                session.Id,
                new CompletePlantingSessionDto { ClientEndTime = DateTime.Now }));

        exception.Code.ShouldBe(KnowledtreeDomainErrorCodes.InvalidPlantingSessionStatus);
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
        result.Session.RequiredFocusDurationSeconds.ShouldBe(10);
    }

    [Fact]
    public async Task Complete_Should_Allow_Five_Minute_Timing_Tolerance()
    {
        var (tree, pool) = await CreateActivePoolAsync(cost: 100);
        var session = await CreateSessionAsync(pool.Id, DateTime.Now);

        var result = await _plantingSessionAppService.CompleteAsync(
            session.Id,
            new CompletePlantingSessionDto { ClientEndTime = DateTime.Now });

        result.ResultTree.Id.ShouldBe(tree.Id);
        result.Session.Status.ShouldBe(PlantingSessionStatus.Claimed);
    }

    [Fact]
    public async Task GetActive_Should_Return_Current_Growing_Session()
    {
        var (_, pool) = await CreateActivePoolAsync(cost: 100);
        var session = await CreateReadySessionAsync(pool.Id);

        var activeSession = await _plantingSessionAppService.GetActiveAsync();

        activeSession.ShouldNotBeNull();
        activeSession!.Id.ShouldBe(session.Id);
        activeSession.Status.ShouldBe(PlantingSessionStatus.Growing);
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

    [Fact]
    public async Task GetHistory_Should_Return_Only_Claimed_Sessions_With_Thirty_Item_Pages()
    {
        var (tree, pool) = await CreateActivePoolAsync(cost: 100);
        var tag = await _tagAppService.CreateAsync(new CreateUpdateTagDto
        {
            Name = "Reading",
            ColorCode = "#FFB347"
        });
        var latestEndTime = DateTime.Now.AddMinutes(-1);
        Guid latestSessionId = default;

        for (var index = 0; index < 32; index++)
        {
            var session = await CreateClaimedSessionAsync(
                pool.Id,
                tree.Id,
                tag.Id,
                latestEndTime.AddMinutes(-index));

            if (index == 0)
            {
                latestSessionId = session.Id;
            }
        }

        await CreateGrowingSessionAsync(pool.Id);
        await CreateCancelledSessionAsync(pool.Id);

        var firstPage = await _plantingSessionAppService.GetHistoryAsync(new PagedResultRequestDto
        {
            SkipCount = 0,
            MaxResultCount = 100
        });
        var secondPage = await _plantingSessionAppService.GetHistoryAsync(new PagedResultRequestDto
        {
            SkipCount = 30,
            MaxResultCount = 30
        });

        firstPage.TotalCount.ShouldBe(32);
        firstPage.Items.Count.ShouldBe(30);
        firstPage.Items.All(x => x.Status == PlantingSessionStatus.Claimed).ShouldBeTrue();
        firstPage.Items.First().Id.ShouldBe(latestSessionId);
        firstPage.Items.First().ResultTree.ShouldNotBeNull();
        firstPage.Items.First().ResultTree!.Id.ShouldBe(tree.Id);
        firstPage.Items.First().Tag.ShouldNotBeNull();
        firstPage.Items.First().Tag!.Name.ShouldBe("Reading");
        secondPage.TotalCount.ShouldBe(32);
        secondPage.Items.Count.ShouldBe(2);
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

    private async Task<PlantingSession> CreateClaimedSessionAsync(
        int treePoolId,
        int treeId,
        int tagId,
        DateTime endTime)
    {
        return await WithUnitOfWorkAsync(async () =>
        {
            var startTime = endTime.AddMinutes(-30);
            var session = new PlantingSession(
                Guid.NewGuid(),
                CurrentUserId,
                treePoolId,
                tagId,
                plannedDurationMinutes: 30,
                clientStartTime: startTime,
                serverStartTime: startTime);
            session.Complete(treeId, endTime, endTime, duplicateGemReward: 0, duplicateCoinReward: 0);

            return await _plantingSessionRepository.InsertAsync(session, autoSave: true);
        });
    }

    private async Task<PlantingSession> CreateGrowingSessionAsync(int treePoolId)
    {
        return await WithUnitOfWorkAsync(async () =>
        {
            var startTime = DateTime.Now.AddMinutes(-30);
            var session = new PlantingSession(
                Guid.NewGuid(),
                CurrentUserId,
                treePoolId,
                tagId: null,
                plannedDurationMinutes: 30,
                clientStartTime: startTime,
                serverStartTime: startTime);

            return await _plantingSessionRepository.InsertAsync(session, autoSave: true);
        });
    }

    private async Task<PlantingSession> CreateCancelledSessionAsync(int treePoolId)
    {
        return await WithUnitOfWorkAsync(async () =>
        {
            var startTime = DateTime.Now.AddMinutes(-30);
            var session = new PlantingSession(
                Guid.NewGuid(),
                CurrentUserId,
                treePoolId,
                tagId: null,
                plannedDurationMinutes: 30,
                clientStartTime: startTime,
                serverStartTime: startTime);
            session.Cancel();

            return await _plantingSessionRepository.InsertAsync(session, autoSave: true);
        });
    }

    private async Task<PlantingSession> CreateReadySessionAsync(int treePoolId)
    {
        return await CreateSessionAsync(treePoolId, DateTime.Now.AddMinutes(-5));
    }

    private async Task<PlantingSession> CreateSessionAsync(int treePoolId, DateTime startTime)
    {
        return await WithUnitOfWorkAsync(async () =>
        {
            var session = new PlantingSession(
                Guid.NewGuid(),
                CurrentUserId,
                treePoolId,
                tagId: null,
                plannedDurationMinutes: 30,
                clientStartTime: startTime,
                serverStartTime: startTime);

            return await _plantingSessionRepository.InsertAsync(session, autoSave: true);
        });
    }
}
