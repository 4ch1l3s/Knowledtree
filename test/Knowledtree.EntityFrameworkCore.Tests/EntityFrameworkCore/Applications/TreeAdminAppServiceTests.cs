using System;
using System.Linq;
using System.Threading.Tasks;
using Knowledtree.Trees;
using Shouldly;
using Volo.Abp;
using Volo.Abp.Domain.Repositories;
using Xunit;

namespace Knowledtree.EntityFrameworkCore.Applications;

public class TreeAdminAppServiceTests : KnowledtreeEntityFrameworkCoreTestBase
{
    private static readonly Guid CurrentUserId = Guid.Parse("2e701e62-0953-4dd3-910b-dc6cc93ccb0d");

    private readonly IAdminTreeAppService _adminTreeAppService;
    private readonly IAdminTreePoolAppService _adminTreePoolAppService;
    private readonly IRepository<UserSeedPackage, Guid> _seedPackageRepository;

    public TreeAdminAppServiceTests()
    {
        _adminTreeAppService = GetRequiredService<IAdminTreeAppService>();
        _adminTreePoolAppService = GetRequiredService<IAdminTreePoolAppService>();
        _seedPackageRepository = GetRequiredService<IRepository<UserSeedPackage, Guid>>();
    }

    [Fact]
    public async Task TreePool_Should_Reject_Invalid_Rate_Total()
    {
        var exception = await Should.ThrowAsync<BusinessException>(() =>
            _adminTreePoolAppService.CreateAsync(new CreateUpdateTreePoolDto
            {
                Name = "Invalid pool",
                PoolType = TreePoolType.Permanent,
                CurrencyType = CurrencyType.Gold,
                Cost = 100,
                CommonRate = 90m,
                RareRate = 5m,
                GoldRate = 0m,
                IsActive = false
            }));

        exception.Code.ShouldBe(KnowledtreeDomainErrorCodes.InvalidTreePoolRates);
    }

    [Fact]
    public async Task ReplaceItems_Should_Update_TreePool_Trees()
    {
        var commonTree = await CreateTreeAsync(TreeRarity.Common);
        var rareTree = await CreateTreeAsync(TreeRarity.Rare);
        var pool = await _adminTreePoolAppService.CreateAsync(CreatePoolInput(isActive: false));

        var updated = await _adminTreePoolAppService.ReplaceItemsAsync(
            pool.Id,
            new ReplaceTreePoolItemsDto { TreeIds = [commonTree.Id, rareTree.Id] });

        updated.Trees.Count.ShouldBe(2);
        updated.Trees.Select(x => x.Id).ShouldContain(commonTree.Id);
        updated.Trees.Select(x => x.Id).ShouldContain(rareTree.Id);
    }

    [Fact]
    public async Task Delete_Tree_Should_Fail_When_Tree_Is_In_Pool()
    {
        var tree = await CreateTreeAsync(TreeRarity.Common);
        var pool = await _adminTreePoolAppService.CreateAsync(CreatePoolInput(isActive: false));
        await _adminTreePoolAppService.ReplaceItemsAsync(pool.Id, new ReplaceTreePoolItemsDto { TreeIds = [tree.Id] });

        var exception = await Should.ThrowAsync<BusinessException>(() =>
            _adminTreeAppService.DeleteAsync(tree.Id));

        exception.Code.ShouldBe(KnowledtreeDomainErrorCodes.ReferencedTreeCannotBeDeleted);
    }

    [Fact]
    public async Task Delete_TreePool_Should_Fail_When_User_Has_SeedPackage()
    {
        var tree = await CreateTreeAsync(TreeRarity.Common);
        var pool = await _adminTreePoolAppService.CreateAsync(CreatePoolInput(isActive: false));
        await _adminTreePoolAppService.ReplaceItemsAsync(pool.Id, new ReplaceTreePoolItemsDto { TreeIds = [tree.Id] });

        await WithUnitOfWorkAsync(async () =>
        {
            await _seedPackageRepository.InsertAsync(new UserSeedPackage(
                Guid.NewGuid(),
                CurrentUserId,
                pool.Id,
                quantity: 1));
        });

        var exception = await Should.ThrowAsync<BusinessException>(() =>
            _adminTreePoolAppService.DeleteAsync(pool.Id));

        exception.Code.ShouldBe(KnowledtreeDomainErrorCodes.ReferencedTreePoolCannotBeDeleted);
    }

    private Task<TreeDto> CreateTreeAsync(TreeRarity rarity)
    {
        var suffix = Guid.NewGuid().ToString("N")[..8];
        return _adminTreeAppService.CreateAsync(new CreateUpdateTreeDto
        {
            Name = $"Admin Tree {suffix}",
            Description = "Admin test tree",
            Rarity = rarity,
            ImageKey = $"admin-tree-{suffix}",
            BaseGoldYield = 1
        });
    }

    private CreateUpdateTreePoolDto CreatePoolInput(bool isActive)
    {
        return new CreateUpdateTreePoolDto
        {
            Name = $"Admin Pool {Guid.NewGuid():N}",
            PoolType = TreePoolType.Permanent,
            CurrencyType = CurrencyType.Gold,
            Cost = 100,
            CommonRate = 100m,
            RareRate = 0m,
            GoldRate = 0m,
            IsActive = isActive
        };
    }
}
