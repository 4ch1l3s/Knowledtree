using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Knowledtree.Trees;
using Knowledtree.UserWallets;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Identity;

namespace Knowledtree.Users;

[Authorize(IdentityPermissions.Users.Update)]
public class AdminUserBalanceAppService : KnowledtreeAppService, IAdminUserBalanceAppService
{
    private readonly IIdentityUserRepository _identityUserRepository;
    private readonly IRepository<UserWallet, Guid> _walletRepository;
    private readonly IRepository<UserSeedPackage, Guid> _seedPackageRepository;
    private readonly IRepository<TreePool, int> _treePoolRepository;

    public AdminUserBalanceAppService(
        IIdentityUserRepository identityUserRepository,
        IRepository<UserWallet, Guid> walletRepository,
        IRepository<UserSeedPackage, Guid> seedPackageRepository,
        IRepository<TreePool, int> treePoolRepository)
    {
        _identityUserRepository = identityUserRepository;
        _walletRepository = walletRepository;
        _seedPackageRepository = seedPackageRepository;
        _treePoolRepository = treePoolRepository;
    }

    public virtual async Task<AdminUserBalanceDto> GetAsync(Guid userId)
    {
        await EnsureUserExistsAsync(userId);
        var wallet = await GetOrCreateWalletAsync(userId);
        return await BuildDtoAsync(userId, wallet);
    }

    public virtual async Task<AdminUserBalanceDto> UpdateWalletAsync(Guid userId, UpdateUserWalletDto input)
    {
        await EnsureUserExistsAsync(userId);
        var wallet = await GetOrCreateWalletAsync(userId);

        wallet.SetBalance(input.Coin, input.Gem);
        await _walletRepository.UpdateAsync(wallet, autoSave: true);

        return await BuildDtoAsync(userId, wallet);
    }

    public virtual async Task<AdminUserBalanceDto> UpsertSeedPackageAsync(Guid userId, UpsertUserSeedPackageDto input)
    {
        await EnsureUserExistsAsync(userId);
        var wallet = await GetOrCreateWalletAsync(userId);
        await _treePoolRepository.GetAsync(input.TreePoolId);

        var seedPackage = await FindSeedPackageAsync(userId, input.TreePoolId);
        if (input.Quantity == 0)
        {
            if (seedPackage != null)
            {
                await _seedPackageRepository.DeleteAsync(seedPackage, autoSave: true);
            }

            return await BuildDtoAsync(userId, wallet);
        }

        if (seedPackage == null)
        {
            seedPackage = new UserSeedPackage(GuidGenerator.Create(), userId, input.TreePoolId, input.Quantity);
            await _seedPackageRepository.InsertAsync(seedPackage, autoSave: true);
        }
        else
        {
            seedPackage.SetQuantity(input.Quantity);
            await _seedPackageRepository.UpdateAsync(seedPackage, autoSave: true);
        }

        return await BuildDtoAsync(userId, wallet);
    }

    public virtual async Task<AdminUserBalanceDto> DeleteSeedPackageAsync(Guid userId, int treePoolId)
    {
        await EnsureUserExistsAsync(userId);
        var wallet = await GetOrCreateWalletAsync(userId);
        var seedPackage = await FindSeedPackageAsync(userId, treePoolId);

        if (seedPackage != null)
        {
            await _seedPackageRepository.DeleteAsync(seedPackage, autoSave: true);
        }

        return await BuildDtoAsync(userId, wallet);
    }

    protected virtual async Task EnsureUserExistsAsync(Guid userId)
    {
        await _identityUserRepository.GetAsync(userId);
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

    protected virtual async Task<AdminUserBalanceDto> BuildDtoAsync(Guid userId, UserWallet wallet)
    {
        var treePools = await AsyncExecuter.ToListAsync(
            (await _treePoolRepository.GetQueryableAsync()).OrderBy(x => x.Id));
        var treePoolsById = treePools.ToDictionary(x => x.Id);

        var seedPackages = await AsyncExecuter.ToListAsync(
            (await _seedPackageRepository.GetQueryableAsync())
            .Where(x => x.UserId == userId && x.Quantity > 0)
            .OrderBy(x => x.TreePoolId));

        return new AdminUserBalanceDto
        {
            UserId = userId,
            Wallet = ObjectMapper.Map<UserWallet, WalletDto>(wallet),
            SeedPackages = seedPackages
                .Select(seedPackage => MapSeedPackage(seedPackage, treePoolsById))
                .ToList(),
            TreePools = treePools
                .Select(MapTreePool)
                .ToList()
        };
    }

    protected virtual AdminUserSeedPackageDto MapSeedPackage(
        UserSeedPackage seedPackage,
        IReadOnlyDictionary<int, TreePool> treePoolsById)
    {
        treePoolsById.TryGetValue(seedPackage.TreePoolId, out var treePool);

        return new AdminUserSeedPackageDto
        {
            Id = seedPackage.Id,
            TreePoolId = seedPackage.TreePoolId,
            TreePoolName = treePool?.Name ?? $"Tree Pool #{seedPackage.TreePoolId}",
            PackageImageKey = treePool?.PackageImageKey,
            TreePoolIsActive = treePool?.IsActive ?? false,
            Quantity = seedPackage.Quantity
        };
    }

    protected virtual AdminSeedPackageTreePoolDto MapTreePool(TreePool treePool)
    {
        return new AdminSeedPackageTreePoolDto
        {
            Id = treePool.Id,
            Name = treePool.Name,
            PackageImageKey = treePool.PackageImageKey,
            IsActive = treePool.IsActive,
            PoolType = treePool.PoolType
        };
    }
}
