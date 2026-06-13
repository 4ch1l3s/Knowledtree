using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Knowledtree.Tags;
using Knowledtree.UserWallets;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Domain.Entities;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Users;

namespace Knowledtree.Trees;

[Authorize]
public class PlantingSessionAppService : KnowledtreeAppService, IPlantingSessionAppService
{
    private readonly IRepository<PlantingSession, Guid> _plantingSessionRepository;
    private readonly IRepository<TreePool, int> _treePoolRepository;
    private readonly IRepository<TreePoolItem, int> _treePoolItemRepository;
    private readonly IRepository<Tree, int> _treeRepository;
    private readonly IRepository<UserSeedPackage, Guid> _seedPackageRepository;
    private readonly IRepository<UserTree, Guid> _userTreeRepository;
    private readonly IRepository<UserWallet, Guid> _walletRepository;
    private readonly IRepository<Tag, int> _tagRepository;

    public PlantingSessionAppService(
        IRepository<PlantingSession, Guid> plantingSessionRepository,
        IRepository<TreePool, int> treePoolRepository,
        IRepository<TreePoolItem, int> treePoolItemRepository,
        IRepository<Tree, int> treeRepository,
        IRepository<UserSeedPackage, Guid> seedPackageRepository,
        IRepository<UserTree, Guid> userTreeRepository,
        IRepository<UserWallet, Guid> walletRepository,
        IRepository<Tag, int> tagRepository)
    {
        _plantingSessionRepository = plantingSessionRepository;
        _treePoolRepository = treePoolRepository;
        _treePoolItemRepository = treePoolItemRepository;
        _treeRepository = treeRepository;
        _seedPackageRepository = seedPackageRepository;
        _userTreeRepository = userTreeRepository;
        _walletRepository = walletRepository;
        _tagRepository = tagRepository;
    }

    public virtual async Task<PlantingSessionDto> StartAsync(StartPlantingSessionDto input)
    {
        if (input.PlannedDurationMinutes <= 0)
        {
            throw new BusinessException(KnowledtreeDomainErrorCodes.InvalidPlantingDuration);
        }

        var userId = CurrentUser.GetId();
        var hasActiveSession = await AsyncExecuter.AnyAsync(
            (await _plantingSessionRepository.GetQueryableAsync())
            .Where(x => x.UserId == userId && x.Status == PlantingSessionStatus.Growing));

        if (hasActiveSession)
        {
            throw new BusinessException(KnowledtreeDomainErrorCodes.ActivePlantingSessionAlreadyExists);
        }

        if (input.TagId.HasValue)
        {
            var tag = await _tagRepository.FindAsync(input.TagId.Value);
            if (tag == null || tag.UserId != userId)
            {
                throw new BusinessException(KnowledtreeDomainErrorCodes.TagDoesNotBelongToCurrentUser);
            }
        }

        var pool = await _treePoolRepository.GetAsync(input.TreePoolId);
        if (!pool.IsAvailableAt(Clock.Now))
        {
            throw new BusinessException(KnowledtreeDomainErrorCodes.TreePoolUnavailable);
        }

        var trees = await GetPoolTreesAsync(pool.Id);
        TreePoolValidationHelper.EnsureRequiredRarityItems(pool, trees);

        var seedPackage = await FindSeedPackageAsync(userId, pool.Id);
        if (seedPackage == null || seedPackage.Quantity <= 0)
        {
            throw new BusinessException(KnowledtreeDomainErrorCodes.SeedPackageUnavailable);
        }

        seedPackage.Consume();
        await _seedPackageRepository.UpdateAsync(seedPackage, autoSave: true);

        var now = Clock.Now;
        var session = new PlantingSession(
            GuidGenerator.Create(),
            userId,
            pool.Id,
            input.TagId,
            input.PlannedDurationMinutes,
            input.ClientStartTime ?? now,
            now);

        await _plantingSessionRepository.InsertAsync(session, autoSave: true);

        return MapSession(session);
    }

    public virtual async Task<CompletePlantingSessionResultDto> CompleteAsync(Guid id, CompletePlantingSessionDto input)
    {
        var userId = CurrentUser.GetId();
        var session = await _plantingSessionRepository.GetAsync(id);

        if (session.UserId != userId)
        {
            throw new EntityNotFoundException(typeof(PlantingSession), id);
        }

        var serverEndTime = Clock.Now;
        if ((serverEndTime - session.ServerStartTime).TotalMinutes < session.PlannedDurationMinutes)
        {
            throw new BusinessException(KnowledtreeDomainErrorCodes.PlantingSessionNotReady);
        }

        var pool = await _treePoolRepository.GetAsync(session.TreePoolId);
        var trees = await GetPoolTreesAsync(pool.Id);
        TreePoolValidationHelper.EnsureRequiredRarityItems(pool, trees);

        var resultTree = RollTree(pool, trees);
        var userTree = await FindUserTreeAsync(userId, resultTree.Id);
        var isDuplicate = userTree != null;
        var duplicateGemReward = isDuplicate ? GetDuplicateGemReward(resultTree.Rarity) : 0;
        var wallet = await GetOrCreateWalletAsync(userId);

        if (userTree == null)
        {
            userTree = new UserTree(GuidGenerator.Create(), userId, resultTree.Id, pool.Id, serverEndTime);
            await _userTreeRepository.InsertAsync(userTree, autoSave: true);
        }
        else
        {
            userTree.IncrementObtainedCount();
            if (duplicateGemReward > 0)
            {
                wallet.CreditGem(duplicateGemReward);
                await _walletRepository.UpdateAsync(wallet, autoSave: true);
            }

            await _userTreeRepository.UpdateAsync(userTree, autoSave: true);
        }

        session.Complete(resultTree.Id, input.ClientEndTime, serverEndTime, duplicateGemReward);
        await _plantingSessionRepository.UpdateAsync(session, autoSave: true);

        return new CompletePlantingSessionResultDto
        {
            Session = MapSession(session),
            ResultTree = ObjectMapper.Map<Tree, TreeDto>(resultTree),
            IsDuplicate = isDuplicate,
            TotalObtainedCount = userTree.TotalObtainedCount,
            Wallet = MapWallet(wallet)
        };
    }

    protected virtual Tree RollTree(TreePool pool, List<Tree> trees)
    {
        var rarity = RollRarity(pool);
        var candidates = trees.Where(x => x.Rarity == rarity).ToList();
        if (candidates.Count == 0)
        {
            throw new BusinessException(KnowledtreeDomainErrorCodes.TreePoolMissingRarityItems);
        }

        return candidates[Random.Shared.Next(candidates.Count)];
    }

    protected virtual TreeRarity RollRarity(TreePool pool)
    {
        var roll = (decimal)(Random.Shared.NextDouble() * 100);

        if (roll < pool.CommonRate)
        {
            return TreeRarity.Common;
        }

        if (roll < pool.CommonRate + pool.RareRate)
        {
            return TreeRarity.Rare;
        }

        return TreeRarity.Gold;
    }

    protected virtual int GetDuplicateGemReward(TreeRarity rarity)
    {
        return rarity switch
        {
            TreeRarity.Common => 1,
            TreeRarity.Rare => 5,
            TreeRarity.Gold => 20,
            _ => 0
        };
    }

    protected virtual async Task<UserWallet> GetOrCreateWalletAsync(Guid userId)
    {
        var wallet = await AsyncExecuter.FirstOrDefaultAsync(
            (await _walletRepository.GetQueryableAsync()).Where(x => x.UserId == userId));

        if (wallet != null)
        {
            return wallet;
        }

        wallet = new UserWallet(GuidGenerator.Create(), userId, StoreAppService.StarterCoin, StoreAppService.StarterGem);
        return await _walletRepository.InsertAsync(wallet, autoSave: true);
    }

    protected virtual async Task<UserSeedPackage?> FindSeedPackageAsync(Guid userId, int treePoolId)
    {
        return await AsyncExecuter.FirstOrDefaultAsync(
            (await _seedPackageRepository.GetQueryableAsync())
            .Where(x => x.UserId == userId && x.TreePoolId == treePoolId));
    }

    protected virtual async Task<UserTree?> FindUserTreeAsync(Guid userId, int treeId)
    {
        return await AsyncExecuter.FirstOrDefaultAsync(
            (await _userTreeRepository.GetQueryableAsync())
            .Where(x => x.UserId == userId && x.TreeId == treeId));
    }

    protected virtual async Task<List<Tree>> GetPoolTreesAsync(int treePoolId)
    {
        var items = await AsyncExecuter.ToListAsync(
            (await _treePoolItemRepository.GetQueryableAsync()).Where(x => x.TreePoolId == treePoolId));
        var treeIds = items.Select(x => x.TreeId).Distinct().ToList();

        if (treeIds.Count == 0)
        {
            return [];
        }

        return await AsyncExecuter.ToListAsync(
            (await _treeRepository.GetQueryableAsync()).Where(x => treeIds.Contains(x.Id)));
    }

    protected virtual PlantingSessionDto MapSession(PlantingSession session)
    {
        return ObjectMapper.Map<PlantingSession, PlantingSessionDto>(session);
    }

    protected virtual WalletDto MapWallet(UserWallet wallet)
    {
        return new WalletDto
        {
            Coin = wallet.Coin,
            Gem = wallet.Gem
        };
    }
}
