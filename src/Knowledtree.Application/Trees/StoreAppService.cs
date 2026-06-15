using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Knowledtree.UserWallets;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Users;

namespace Knowledtree.Trees;

[Authorize]
public class StoreAppService : KnowledtreeAppService, IStoreAppService
{
    public const long StarterCoin = 1000;
    public const long StarterGem = 150;

    private readonly IRepository<UserWallet, Guid> _walletRepository;
    private readonly IRepository<TreePool, int> _treePoolRepository;
    private readonly IRepository<TreePoolItem, int> _treePoolItemRepository;
    private readonly IRepository<Tree, int> _treeRepository;
    private readonly IRepository<UserSeedPackage, Guid> _seedPackageRepository;

    public StoreAppService(
        IRepository<UserWallet, Guid> walletRepository,
        IRepository<TreePool, int> treePoolRepository,
        IRepository<TreePoolItem, int> treePoolItemRepository,
        IRepository<Tree, int> treeRepository,
        IRepository<UserSeedPackage, Guid> seedPackageRepository)
    {
        _walletRepository = walletRepository;
        _treePoolRepository = treePoolRepository;
        _treePoolItemRepository = treePoolItemRepository;
        _treeRepository = treeRepository;
        _seedPackageRepository = seedPackageRepository;
    }

    public virtual async Task<WalletDto> GetMyWalletAsync()
    {
        var wallet = await GetOrCreateWalletAsync(CurrentUser.GetId());
        return MapWallet(wallet);
    }

    public virtual async Task<List<TreePoolDto>> GetAvailableTreePoolsAsync()
    {
        var userId = CurrentUser.GetId();
        var now = Clock.Now;
        var seedPackages = await GetSeedPackagesByUserIdAsync(userId);
        var seedPackageQuantities = seedPackages.ToDictionary(x => x.TreePoolId, x => x.Quantity);

        var pools = await AsyncExecuter.ToListAsync(
            (await _treePoolRepository.GetQueryableAsync())
            .Where(x => x.IsActive));

        var result = new List<TreePoolDto>();
        foreach (var pool in pools.Where(x => x.IsAvailableAt(now)).OrderBy(x => x.Id))
        {
            var trees = await GetPoolTreesAsync(pool.Id);
            try
            {
                TreePoolValidationHelper.EnsureRequiredRarityItems(pool, trees);
            }
            catch (BusinessException)
            {
                continue;
            }

            result.Add(MapTreePool(pool, trees, seedPackageQuantities.GetValueOrDefault(pool.Id)));
        }

        return result;
    }

    public virtual async Task<List<SeedPackageDto>> GetMySeedPackagesAsync()
    {
        var packages = await GetSeedPackagesByUserIdAsync(CurrentUser.GetId());
        var poolIds = packages.Select(x => x.TreePoolId).Distinct().ToList();
        var pools = poolIds.Count == 0
            ? []
            : await AsyncExecuter.ToListAsync(
                (await _treePoolRepository.GetQueryableAsync()).Where(x => poolIds.Contains(x.Id)));
        var poolsById = pools.ToDictionary(x => x.Id);

        return packages
            .OrderBy(x => x.TreePoolId)
            .Select(x =>
            {
                poolsById.TryGetValue(x.TreePoolId, out var pool);
                return MapSeedPackage(x, pool?.Name ?? string.Empty, pool?.PackageImageKey);
            })
            .ToList();
    }

    public virtual async Task<BuySeedPackageResultDto> BuySeedPackageAsync(int treePoolId)
    {
        var result = await BuySeedPackagesAsync(new BuySeedPackagesDto
        {
            Items =
            [
                new BuySeedPackageItemDto
                {
                    TreePoolId = treePoolId,
                    Quantity = 1
                }
            ]
        });

        return new BuySeedPackageResultDto
        {
            Wallet = result.Wallet,
            SeedPackage = result.SeedPackages.Single(x => x.TreePoolId == treePoolId)
        };
    }

    public virtual async Task<BuySeedPackagesResultDto> BuySeedPackagesAsync(BuySeedPackagesDto input)
    {
        var userId = CurrentUser.GetId();
        var quantitiesByPoolId = AggregatePurchaseItems(input);
        var poolsById = new Dictionary<int, TreePool>();
        var now = Clock.Now;

        foreach (var treePoolId in quantitiesByPoolId.Keys)
        {
            var pool = await _treePoolRepository.GetAsync(treePoolId);
            if (!pool.IsAvailableAt(now))
            {
                throw new BusinessException(KnowledtreeDomainErrorCodes.TreePoolUnavailable);
            }

            var trees = await GetPoolTreesAsync(pool.Id);
            TreePoolValidationHelper.EnsureRequiredRarityItems(pool, trees);
            poolsById[pool.Id] = pool;
        }

        var (coinCost, gemCost) = CalculatePurchaseCosts(poolsById, quantitiesByPoolId);

        var wallet = await GetOrCreateWalletAsync(userId);
        DebitWallet(wallet, coinCost, gemCost);

        var poolIds = quantitiesByPoolId.Keys.ToList();
        var existingPackages = await AsyncExecuter.ToListAsync(
            (await _seedPackageRepository.GetQueryableAsync())
            .Where(x => x.UserId == userId && poolIds.Contains(x.TreePoolId)));
        var seedPackagesByPoolId = existingPackages.ToDictionary(x => x.TreePoolId);
        var updatedSeedPackages = new List<SeedPackageDto>();

        foreach (var item in quantitiesByPoolId)
        {
            var treePoolId = item.Key;
            var quantity = item.Value;
            var pool = poolsById[treePoolId];

            if (!seedPackagesByPoolId.TryGetValue(treePoolId, out var seedPackage))
            {
                seedPackage = new UserSeedPackage(GuidGenerator.Create(), userId, treePoolId, quantity);
                await _seedPackageRepository.InsertAsync(seedPackage, autoSave: false);
            }
            else
            {
                seedPackage.Add(quantity);
                await _seedPackageRepository.UpdateAsync(seedPackage, autoSave: false);
            }

            updatedSeedPackages.Add(MapSeedPackage(seedPackage, pool.Name, pool.PackageImageKey));
        }

        await _walletRepository.UpdateAsync(wallet, autoSave: true);

        return new BuySeedPackagesResultDto
        {
            Wallet = MapWallet(wallet),
            SeedPackages = updatedSeedPackages
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

        wallet = new UserWallet(GuidGenerator.Create(), userId, StarterCoin, StarterGem);
        return await _walletRepository.InsertAsync(wallet, autoSave: true);
    }

    protected virtual async Task<List<UserSeedPackage>> GetSeedPackagesByUserIdAsync(Guid userId)
    {
        return await AsyncExecuter.ToListAsync(
            (await _seedPackageRepository.GetQueryableAsync()).Where(x => x.UserId == userId && x.Quantity > 0));
    }

    protected virtual async Task<UserSeedPackage?> FindSeedPackageAsync(Guid userId, int treePoolId)
    {
        return await AsyncExecuter.FirstOrDefaultAsync(
            (await _seedPackageRepository.GetQueryableAsync())
            .Where(x => x.UserId == userId && x.TreePoolId == treePoolId));
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

    protected virtual Dictionary<int, int> AggregatePurchaseItems(BuySeedPackagesDto input)
    {
        if (input?.Items == null || input.Items.Count == 0)
        {
            throw new BusinessException(KnowledtreeDomainErrorCodes.InvalidSeedPackageQuantity);
        }

        var quantitiesByPoolId = new Dictionary<int, int>();
        foreach (var item in input.Items)
        {
            if (item.Quantity <= 0)
            {
                throw new BusinessException(KnowledtreeDomainErrorCodes.InvalidSeedPackageQuantity);
            }

            quantitiesByPoolId.TryGetValue(item.TreePoolId, out var currentQuantity);
            var nextQuantity = (long)currentQuantity + item.Quantity;
            if (nextQuantity > int.MaxValue)
            {
                throw new BusinessException(KnowledtreeDomainErrorCodes.InvalidSeedPackageQuantity);
            }

            quantitiesByPoolId[item.TreePoolId] = (int)nextQuantity;
        }

        return quantitiesByPoolId;
    }

    protected virtual (long CoinCost, long GemCost) CalculatePurchaseCosts(
        IReadOnlyDictionary<int, TreePool> poolsById,
        IReadOnlyDictionary<int, int> quantitiesByPoolId)
    {
        long coinCost = 0;
        long gemCost = 0;

        try
        {
            foreach (var item in quantitiesByPoolId)
            {
                var pool = poolsById[item.Key];
                if (pool.Cost == 0)
                {
                    continue;
                }

                var cost = checked((long)pool.Cost * item.Value);
                switch (pool.CurrencyType)
                {
                    case CurrencyType.Gold:
                        coinCost = checked(coinCost + cost);
                        break;
                    case CurrencyType.Gem:
                        gemCost = checked(gemCost + cost);
                        break;
                    case CurrencyType.FreeTicket:
                    default:
                        throw new BusinessException(KnowledtreeDomainErrorCodes.UnsupportedTreePoolCurrency);
                }
            }
        }
        catch (OverflowException)
        {
            throw new BusinessException(KnowledtreeDomainErrorCodes.InvalidWalletAmount);
        }

        return (coinCost, gemCost);
    }

    protected virtual void DebitWallet(UserWallet wallet, long coinCost, long gemCost)
    {
        if (wallet.Coin < coinCost || wallet.Gem < gemCost)
        {
            throw new BusinessException(KnowledtreeDomainErrorCodes.InsufficientWalletBalance);
        }

        if (coinCost > 0)
        {
            wallet.DebitCoin(coinCost);
        }

        if (gemCost > 0)
        {
            wallet.DebitGem(gemCost);
        }
    }

    protected virtual WalletDto MapWallet(UserWallet wallet)
    {
        return new WalletDto
        {
            Coin = wallet.Coin,
            Gem = wallet.Gem
        };
    }

    protected virtual SeedPackageDto MapSeedPackage(
        UserSeedPackage seedPackage,
        string treePoolName,
        string? packageImageKey)
    {
        return new SeedPackageDto
        {
            Id = seedPackage.Id,
            TreePoolId = seedPackage.TreePoolId,
            TreePoolName = treePoolName,
            PackageImageKey = packageImageKey,
            Quantity = seedPackage.Quantity
        };
    }

    protected virtual TreePoolDto MapTreePool(TreePool pool, List<Tree> trees, int ownedSeedQuantity = 0)
    {
        var dto = ObjectMapper.Map<TreePool, TreePoolDto>(pool);
        dto.OwnedSeedQuantity = ownedSeedQuantity;
        dto.Trees = trees
            .OrderBy(x => x.Rarity)
            .ThenBy(x => x.Name)
            .Select(ObjectMapper.Map<Tree, TreeDto>)
            .ToList();

        return dto;
    }
}
