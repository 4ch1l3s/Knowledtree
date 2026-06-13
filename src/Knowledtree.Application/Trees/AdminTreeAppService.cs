using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Knowledtree.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Domain.Repositories;

namespace Knowledtree.Trees;

[Authorize(KnowledtreePermissions.TreeManagement.Trees.Default)]
public class AdminTreeAppService : KnowledtreeAppService, IAdminTreeAppService
{
    private readonly IRepository<Tree, int> _treeRepository;
    private readonly IRepository<TreePoolItem, int> _treePoolItemRepository;
    private readonly IRepository<PlantingSession, System.Guid> _plantingSessionRepository;
    private readonly IRepository<UserTree, System.Guid> _userTreeRepository;

    public AdminTreeAppService(
        IRepository<Tree, int> treeRepository,
        IRepository<TreePoolItem, int> treePoolItemRepository,
        IRepository<PlantingSession, System.Guid> plantingSessionRepository,
        IRepository<UserTree, System.Guid> userTreeRepository)
    {
        _treeRepository = treeRepository;
        _treePoolItemRepository = treePoolItemRepository;
        _plantingSessionRepository = plantingSessionRepository;
        _userTreeRepository = userTreeRepository;
    }

    public virtual async Task<List<TreeDto>> GetListAsync()
    {
        var trees = await AsyncExecuter.ToListAsync(
            (await _treeRepository.GetQueryableAsync())
            .OrderBy(x => x.Rarity)
            .ThenBy(x => x.Name));

        return trees.Select(ObjectMapper.Map<Tree, TreeDto>).ToList();
    }

    public virtual async Task<TreeDto> GetAsync(int id)
    {
        return ObjectMapper.Map<Tree, TreeDto>(await _treeRepository.GetAsync(id));
    }

    [Authorize(KnowledtreePermissions.TreeManagement.Trees.Create)]
    public virtual async Task<TreeDto> CreateAsync(CreateUpdateTreeDto input)
    {
        var tree = new Tree(
            input.Name,
            input.Description,
            input.Rarity,
            input.ImageKey,
            input.BaseGoldYield);

        await _treeRepository.InsertAsync(tree, autoSave: true);
        return ObjectMapper.Map<Tree, TreeDto>(tree);
    }

    [Authorize(KnowledtreePermissions.TreeManagement.Trees.Update)]
    public virtual async Task<TreeDto> UpdateAsync(int id, CreateUpdateTreeDto input)
    {
        var tree = await _treeRepository.GetAsync(id);
        tree.Update(
            input.Name,
            input.Description,
            input.Rarity,
            input.ImageKey,
            input.BaseGoldYield);

        await _treeRepository.UpdateAsync(tree, autoSave: true);
        return ObjectMapper.Map<Tree, TreeDto>(tree);
    }

    [Authorize(KnowledtreePermissions.TreeManagement.Trees.Delete)]
    public virtual async Task DeleteAsync(int id)
    {
        var isReferenced = await AsyncExecuter.AnyAsync(
                (await _treePoolItemRepository.GetQueryableAsync()).Where(x => x.TreeId == id))
            || await AsyncExecuter.AnyAsync(
                (await _plantingSessionRepository.GetQueryableAsync()).Where(x => x.ResultTreeId == id))
            || await AsyncExecuter.AnyAsync(
                (await _userTreeRepository.GetQueryableAsync()).Where(x => x.TreeId == id));

        if (isReferenced)
        {
            throw new BusinessException(KnowledtreeDomainErrorCodes.ReferencedTreeCannotBeDeleted);
        }

        await _treeRepository.DeleteAsync(id);
    }
}
