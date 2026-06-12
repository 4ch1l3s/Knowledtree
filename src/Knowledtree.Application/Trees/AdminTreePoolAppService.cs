using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Knowledtree.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Domain.Repositories;

namespace Knowledtree.Trees;

[Authorize(KnowledtreePermissions.TreeManagement.TreePools.Default)]
public class AdminTreePoolAppService : KnowledtreeAppService, IAdminTreePoolAppService
{
    private readonly IRepository<TreePool, int> _treePoolRepository;
    private readonly IRepository<TreePoolItem, int> _treePoolItemRepository;
    private readonly IRepository<Tree, int> _treeRepository;
    private readonly IRepository<PlantingSession, Guid> _plantingSessionRepository;
    private readonly IRepository<UserSeedPackage, Guid> _seedPackageRepository;
    private readonly IRepository<UserTree, Guid> _userTreeRepository;

    public AdminTreePoolAppService(
        IRepository<TreePool, int> treePoolRepository,
        IRepository<TreePoolItem, int> treePoolItemRepository,
        IRepository<Tree, int> treeRepository,
        IRepository<PlantingSession, Guid> plantingSessionRepository,
        IRepository<UserSeedPackage, Guid> seedPackageRepository,
        IRepository<UserTree, Guid> userTreeRepository)
    {
        _treePoolRepository = treePoolRepository;
        _treePoolItemRepository = treePoolItemRepository;
        _treeRepository = treeRepository;
        _plantingSessionRepository = plantingSessionRepository;
        _seedPackageRepository = seedPackageRepository;
        _userTreeRepository = userTreeRepository;
    }

    public virtual async Task<List<TreePoolDto>> GetListAsync()
    {
        var pools = await AsyncExecuter.ToListAsync(
            (await _treePoolRepository.GetQueryableAsync()).OrderBy(x => x.Id));
        var result = new List<TreePoolDto>(pools.Count);

        foreach (var pool in pools)
        {
            result.Add(MapTreePool(pool, await GetPoolTreesAsync(pool.Id)));
        }

        return result;
    }

    public virtual async Task<TreePoolDto> GetAsync(int id)
    {
        var pool = await _treePoolRepository.GetAsync(id);
        return MapTreePool(pool, await GetPoolTreesAsync(pool.Id));
    }

    [Authorize(KnowledtreePermissions.TreeManagement.TreePools.Create)]
    public virtual async Task<TreePoolDto> CreateAsync(CreateUpdateTreePoolDto input)
    {
        ValidateInput(input);
        if (input.IsActive)
        {
            TreePoolValidationHelper.EnsureRequiredRarityItems(
                input.CommonRate,
                input.RareRate,
                input.GoldRate,
                []);
        }

        var pool = new TreePool(
            input.Name,
            input.PoolType,
            input.CurrencyType,
            input.Cost,
            input.CommonRate,
            input.RareRate,
            input.GoldRate,
            input.StartTime,
            input.EndTime,
            input.IsActive,
            input.PackageImageKey);

        await _treePoolRepository.InsertAsync(pool, autoSave: true);
        return MapTreePool(pool, []);
    }

    [Authorize(KnowledtreePermissions.TreeManagement.TreePools.Update)]
    public virtual async Task<TreePoolDto> UpdateAsync(int id, CreateUpdateTreePoolDto input)
    {
        ValidateInput(input);

        var pool = await _treePoolRepository.GetAsync(id);
        var trees = await GetPoolTreesAsync(id);
        if (input.IsActive)
        {
            TreePoolValidationHelper.EnsureRequiredRarityItems(
                input.CommonRate,
                input.RareRate,
                input.GoldRate,
                trees);
        }

        pool.Update(
            input.Name,
            input.PoolType,
            input.CurrencyType,
            input.Cost,
            input.CommonRate,
            input.RareRate,
            input.GoldRate,
            input.StartTime,
            input.EndTime,
            input.IsActive,
            input.PackageImageKey);

        await _treePoolRepository.UpdateAsync(pool, autoSave: true);
        return MapTreePool(pool, trees);
    }

    [Authorize(KnowledtreePermissions.TreeManagement.TreePools.ManageItems)]
    public virtual async Task<TreePoolDto> ReplaceItemsAsync(int id, ReplaceTreePoolItemsDto input)
    {
        var pool = await _treePoolRepository.GetAsync(id);
        var treeIds = input.TreeIds.Distinct().ToList();
        var trees = await GetTreesByIdsAsync(treeIds);

        if (trees.Count != treeIds.Count)
        {
            throw new BusinessException(KnowledtreeDomainErrorCodes.TreePoolMissingRarityItems);
        }

        if (pool.IsActive)
        {
            TreePoolValidationHelper.EnsureRequiredRarityItems(pool, trees);
        }

        var existingItems = await AsyncExecuter.ToListAsync(
            (await _treePoolItemRepository.GetQueryableAsync()).Where(x => x.TreePoolId == id));

        foreach (var existingItem in existingItems)
        {
            await _treePoolItemRepository.DeleteAsync(existingItem, autoSave: true);
        }

        foreach (var treeId in treeIds)
        {
            await _treePoolItemRepository.InsertAsync(new TreePoolItem(id, treeId), autoSave: true);
        }

        return MapTreePool(pool, trees);
    }

    [Authorize(KnowledtreePermissions.TreeManagement.TreePools.Delete)]
    public virtual async Task DeleteAsync(int id)
    {
        var isReferenced = await AsyncExecuter.AnyAsync(
                (await _plantingSessionRepository.GetQueryableAsync()).Where(x => x.TreePoolId == id))
            || await AsyncExecuter.AnyAsync(
                (await _seedPackageRepository.GetQueryableAsync()).Where(x => x.TreePoolId == id))
            || await AsyncExecuter.AnyAsync(
                (await _userTreeRepository.GetQueryableAsync()).Where(x => x.FirstObtainedFromPoolId == id));

        if (isReferenced)
        {
            throw new BusinessException(KnowledtreeDomainErrorCodes.ReferencedTreePoolCannotBeDeleted);
        }

        await _treePoolRepository.DeleteAsync(id);
    }

    protected virtual void ValidateInput(CreateUpdateTreePoolDto input)
    {
        TreePoolValidationHelper.ValidatePoolInput(
            input.Cost,
            input.CommonRate,
            input.RareRate,
            input.GoldRate,
            input.StartTime,
            input.EndTime);
    }

    protected virtual async Task<List<Tree>> GetPoolTreesAsync(int treePoolId)
    {
        var items = await AsyncExecuter.ToListAsync(
            (await _treePoolItemRepository.GetQueryableAsync()).Where(x => x.TreePoolId == treePoolId));
        var treeIds = items.Select(x => x.TreeId).Distinct().ToList();

        return await GetTreesByIdsAsync(treeIds);
    }

    protected virtual async Task<List<Tree>> GetTreesByIdsAsync(List<int> treeIds)
    {
        if (treeIds.Count == 0)
        {
            return [];
        }

        return await AsyncExecuter.ToListAsync(
            (await _treeRepository.GetQueryableAsync()).Where(x => treeIds.Contains(x.Id)));
    }

    protected virtual TreePoolDto MapTreePool(TreePool pool, List<Tree> trees)
    {
        var dto = ObjectMapper.Map<TreePool, TreePoolDto>(pool);
        dto.Trees = trees
            .OrderBy(x => x.Rarity)
            .ThenBy(x => x.Name)
            .Select(ObjectMapper.Map<Tree, TreeDto>)
            .ToList();
        return dto;
    }
}
