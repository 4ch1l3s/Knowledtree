using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Knowledtree.Permissions;
using Knowledtree.Tags;
using Knowledtree.UserWallets;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Authorization.Permissions;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Domain.Entities;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Users;

namespace Knowledtree.Trees;

[Authorize]
public class PlantingSessionAppService : KnowledtreeAppService, IPlantingSessionAppService
{
    private const int CommonDuplicateCoinReward = 200;
    private const int RareDuplicateGemReward = 1;
    private const int GoldDuplicateGemReward = 5;
    private const int TesterFocusDurationSeconds = 10;
    private const int MinPlannedDurationMinutes = 30;
    private const int MaxPlannedDurationMinutes = 180;
    private const int CompletionToleranceSeconds = 5 * 60;
    private const int DefaultHistoryPageSize = 30;
    private const int MaxHistoryPageSize = 30;

    private readonly IRepository<PlantingSession, Guid> _plantingSessionRepository;
    private readonly IRepository<TreePool, int> _treePoolRepository;
    private readonly IRepository<TreePoolItem, int> _treePoolItemRepository;
    private readonly IRepository<Tree, int> _treeRepository;
    private readonly IRepository<UserSeedPackage, Guid> _seedPackageRepository;
    private readonly IRepository<UserTree, Guid> _userTreeRepository;
    private readonly IRepository<UserWallet, Guid> _walletRepository;
    private readonly IRepository<Tag, int> _tagRepository;
    private readonly IPermissionChecker _permissionChecker;

    public PlantingSessionAppService(
        IRepository<PlantingSession, Guid> plantingSessionRepository,
        IRepository<TreePool, int> treePoolRepository,
        IRepository<TreePoolItem, int> treePoolItemRepository,
        IRepository<Tree, int> treeRepository,
        IRepository<UserSeedPackage, Guid> seedPackageRepository,
        IRepository<UserTree, Guid> userTreeRepository,
        IRepository<UserWallet, Guid> walletRepository,
        IRepository<Tag, int> tagRepository,
        IPermissionChecker permissionChecker)
    {
        _plantingSessionRepository = plantingSessionRepository;
        _treePoolRepository = treePoolRepository;
        _treePoolItemRepository = treePoolItemRepository;
        _treeRepository = treeRepository;
        _seedPackageRepository = seedPackageRepository;
        _userTreeRepository = userTreeRepository;
        _walletRepository = walletRepository;
        _tagRepository = tagRepository;
        _permissionChecker = permissionChecker;
    }

    public virtual async Task<PlantingSessionDto> StartAsync(StartPlantingSessionDto input)
    {
        if (
            input.PlannedDurationMinutes < MinPlannedDurationMinutes
            || input.PlannedDurationMinutes > MaxPlannedDurationMinutes)
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
        TreePoolValidationHelper.EnsureRequiredRarityItems(
            GetEffectiveRarityRates(pool, input.PlannedDurationMinutes),
            trees);

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

        return MapSession(
            session,
            await GetRequiredFocusDurationSecondsAsync(session));
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
        var requiredFocusDurationSeconds = await GetRequiredFocusDurationSecondsAsync(session);
        if (!IsReadyToComplete(session, serverEndTime, requiredFocusDurationSeconds))
        {
            throw new BusinessException(KnowledtreeDomainErrorCodes.PlantingSessionNotReady);
        }

        var pool = await _treePoolRepository.GetAsync(session.TreePoolId);
        var trees = await GetPoolTreesAsync(pool.Id);
        TreePoolValidationHelper.EnsureRequiredRarityItems(pool, trees);
        TreePoolValidationHelper.EnsureRequiredRarityItems(
            GetEffectiveRarityRates(pool, session.PlannedDurationMinutes),
            trees);

        var resultTree = RollTree(pool, trees, session.PlannedDurationMinutes);
        var userTree = await FindUserTreeAsync(userId, resultTree.Id);
        var isDuplicate = userTree != null;
        var duplicateGemReward = isDuplicate ? GetDuplicateGemReward(resultTree.Rarity) : 0;
        var duplicateCoinReward = isDuplicate ? GetDuplicateCoinReward(resultTree.Rarity) : 0;
        var wallet = await GetOrCreateWalletAsync(userId);

        if (userTree == null)
        {
            userTree = new UserTree(GuidGenerator.Create(), userId, resultTree.Id, pool.Id, serverEndTime);
            await _userTreeRepository.InsertAsync(userTree, autoSave: true);
        }
        else
        {
            userTree.IncrementObtainedCount();
            if (duplicateCoinReward > 0)
            {
                wallet.CreditCoin(duplicateCoinReward);
                await _walletRepository.UpdateAsync(wallet, autoSave: true);
            }

            if (duplicateGemReward > 0)
            {
                wallet.CreditGem(duplicateGemReward);
                await _walletRepository.UpdateAsync(wallet, autoSave: true);
            }

            await _userTreeRepository.UpdateAsync(userTree, autoSave: true);
        }

        session.Complete(resultTree.Id, input.ClientEndTime, serverEndTime, duplicateGemReward, duplicateCoinReward);
        await _plantingSessionRepository.UpdateAsync(session, autoSave: true);

        return new CompletePlantingSessionResultDto
        {
            Session = MapSession(session, requiredFocusDurationSeconds),
            ResultTree = ObjectMapper.Map<Tree, TreeDto>(resultTree),
            IsDuplicate = isDuplicate,
            BonusCoinReward = duplicateCoinReward,
            BonusGemReward = duplicateGemReward,
            TotalObtainedCount = userTree.TotalObtainedCount,
            Wallet = MapWallet(wallet)
        };
    }

    public virtual async Task<PlantingSessionDto?> GetActiveAsync()
    {
        var userId = CurrentUser.GetId();
        var session = await AsyncExecuter.FirstOrDefaultAsync(
            (await _plantingSessionRepository.GetQueryableAsync())
            .Where(x => x.UserId == userId && x.Status == PlantingSessionStatus.Growing)
            .OrderByDescending(x => x.ServerStartTime));

        return session == null
            ? null
            : MapSession(session, await GetRequiredFocusDurationSecondsAsync(session));
    }

    public virtual async Task<PagedResultDto<PlantingSessionHistoryItemDto>> GetHistoryAsync(
        PagedResultRequestDto input)
    {
        var userId = CurrentUser.GetId();
        var paging = NormalizeHistoryPaging(input);
        var query = (await _plantingSessionRepository.GetQueryableAsync())
            .Where(x => x.UserId == userId && x.Status == PlantingSessionStatus.Claimed);
        var totalCount = await AsyncExecuter.CountAsync(query);

        if (totalCount == 0)
        {
            return new PagedResultDto<PlantingSessionHistoryItemDto>(0, []);
        }

        var sessions = await AsyncExecuter.ToListAsync(
            query
                .OrderByDescending(x => x.ServerEndTime)
                .ThenByDescending(x => x.ServerStartTime)
                .Skip(paging.SkipCount)
                .Take(paging.MaxResultCount));

        return new PagedResultDto<PlantingSessionHistoryItemDto>(
            totalCount,
            await MapHistoryItemsAsync(sessions));
    }

    protected virtual (int SkipCount, int MaxResultCount) NormalizeHistoryPaging(PagedResultRequestDto input)
    {
        var skipCount = Math.Max(input.SkipCount, 0);
        var maxResultCount = input.MaxResultCount <= 0
            ? DefaultHistoryPageSize
            : Math.Min(input.MaxResultCount, MaxHistoryPageSize);

        return (skipCount, maxResultCount);
    }

    protected virtual async Task<List<PlantingSessionHistoryItemDto>> MapHistoryItemsAsync(
        List<PlantingSession> sessions)
    {
        var resultTreeIds = sessions
            .Where(x => x.ResultTreeId.HasValue)
            .Select(x => x.ResultTreeId!.Value)
            .Distinct()
            .ToList();
        var tagIds = sessions
            .Where(x => x.TagId.HasValue)
            .Select(x => x.TagId!.Value)
            .Distinct()
            .ToList();

        var trees = resultTreeIds.Count == 0
            ? []
            : await AsyncExecuter.ToListAsync(
                (await _treeRepository.GetQueryableAsync()).Where(x => resultTreeIds.Contains(x.Id)));
        var tags = tagIds.Count == 0
            ? []
            : await AsyncExecuter.ToListAsync(
                (await _tagRepository.GetQueryableAsync()).Where(x => tagIds.Contains(x.Id)));
        var treesById = trees.ToDictionary(x => x.Id);
        var tagsById = tags.ToDictionary(x => x.Id);
        var items = new List<PlantingSessionHistoryItemDto>(sessions.Count);

        foreach (var session in sessions)
        {
            var item = ObjectMapper.Map<PlantingSession, PlantingSessionHistoryItemDto>(session);
            item.RequiredFocusDurationSeconds = await GetRequiredFocusDurationSecondsAsync(session);

            if (session.ResultTreeId.HasValue && treesById.TryGetValue(session.ResultTreeId.Value, out var tree))
            {
                item.ResultTree = ObjectMapper.Map<Tree, TreeDto>(tree);
            }

            if (session.TagId.HasValue && tagsById.TryGetValue(session.TagId.Value, out var tag))
            {
                item.Tag = ObjectMapper.Map<Tag, TagDto>(tag);
            }

            items.Add(item);
        }

        return items;
    }

    protected virtual Tree RollTree(TreePool pool, List<Tree> trees, int plannedDurationMinutes)
    {
        var rarity = RollRarity(pool, plannedDurationMinutes);
        var candidates = trees.Where(x => x.Rarity == rarity).ToList();
        if (candidates.Count == 0)
        {
            throw new BusinessException(KnowledtreeDomainErrorCodes.TreePoolMissingRarityItems);
        }

        return candidates[Random.Shared.Next(candidates.Count)];
    }

    protected virtual bool IsReadyToComplete(
        PlantingSession session,
        DateTime serverEndTime,
        int requiredFocusDurationSeconds)
    {
        return (serverEndTime - session.ServerStartTime).TotalSeconds + CompletionToleranceSeconds
            >= requiredFocusDurationSeconds;
    }

    protected virtual TreeRarity RollRarity(TreePool pool, int plannedDurationMinutes)
    {
        var roll = (decimal)(Random.Shared.NextDouble() * 100);
        var (adjustedCommonRate, adjustedRareRate, _) = GetEffectiveRarityRates(pool, plannedDurationMinutes);

        if (roll < adjustedCommonRate)
        {
            return TreeRarity.Common;
        }

        if (roll < adjustedCommonRate + adjustedRareRate)
        {
            return TreeRarity.Rare;
        }

        return TreeRarity.Gold;
    }

    protected virtual (decimal CommonRate, decimal RareRate, decimal GoldRate) GetEffectiveRarityRates(
        TreePool pool,
        int plannedDurationMinutes)
    {
        var rateFactor = GetRareGoldRateFactor(plannedDurationMinutes);
        var adjustedGoldRate = pool.GoldRate * rateFactor;
        var adjustedRareRate = pool.RareRate * rateFactor;

        return (100m - adjustedRareRate - adjustedGoldRate, adjustedRareRate, adjustedGoldRate);
    }

    protected virtual decimal GetRareGoldRateFactor(int plannedDurationMinutes)
    {
        if (plannedDurationMinutes <= 30)
        {
            return 1m / 3m;
        }

        if (plannedDurationMinutes <= 90)
        {
            return Interpolate(plannedDurationMinutes, 30m, 90m, 1m / 3m, 2m / 3m);
        }

        if (plannedDurationMinutes < 180)
        {
            return Interpolate(plannedDurationMinutes, 90m, 180m, 2m / 3m, 1m);
        }

        return 1m;
    }

    private static decimal Interpolate(
        decimal value,
        decimal fromValue,
        decimal toValue,
        decimal fromFactor,
        decimal toFactor)
    {
        return fromFactor + ((value - fromValue) / (toValue - fromValue)) * (toFactor - fromFactor);
    }

    protected virtual int GetDuplicateGemReward(TreeRarity rarity)
    {
        return rarity switch
        {
            TreeRarity.Rare => RareDuplicateGemReward,
            TreeRarity.Gold => GoldDuplicateGemReward,
            _ => 0
        };
    }

    protected virtual int GetDuplicateCoinReward(TreeRarity rarity)
    {
        return rarity == TreeRarity.Common ? CommonDuplicateCoinReward : 0;
    }

    protected virtual async Task<int> GetRequiredFocusDurationSecondsAsync(PlantingSession session)
    {
        return await CanUseTesterFocusDurationAsync()
            ? TesterFocusDurationSeconds
            : session.PlannedDurationMinutes * 60;
    }

    protected virtual Task<bool> CanUseTesterFocusDurationAsync()
    {
        return _permissionChecker.IsGrantedAsync(KnowledtreePermissions.Tester);
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

    protected virtual PlantingSessionDto MapSession(
        PlantingSession session,
        int requiredFocusDurationSeconds)
    {
        var dto = ObjectMapper.Map<PlantingSession, PlantingSessionDto>(session);
        dto.RequiredFocusDurationSeconds = requiredFocusDurationSeconds;
        return dto;
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
