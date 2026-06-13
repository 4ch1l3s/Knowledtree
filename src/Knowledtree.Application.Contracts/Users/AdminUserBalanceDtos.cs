using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Knowledtree.Trees;

namespace Knowledtree.Users;

[Serializable]
public class AdminUserBalanceDto
{
    public Guid UserId { get; set; }

    public WalletDto Wallet { get; set; } = null!;

    public List<AdminUserSeedPackageDto> SeedPackages { get; set; } = [];

    public List<AdminSeedPackageTreePoolDto> TreePools { get; set; } = [];
}

[Serializable]
public class AdminUserSeedPackageDto
{
    public Guid Id { get; set; }

    public int TreePoolId { get; set; }

    public string TreePoolName { get; set; } = null!;

    public string? PackageImageKey { get; set; }

    public bool TreePoolIsActive { get; set; }

    public int Quantity { get; set; }
}

[Serializable]
public class AdminSeedPackageTreePoolDto
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string? PackageImageKey { get; set; }

    public bool IsActive { get; set; }

    public TreePoolType PoolType { get; set; }
}

[Serializable]
public class UpdateUserWalletDto
{
    [Range(typeof(long), "0", "9223372036854775807")]
    public long Coin { get; set; }

    [Range(typeof(long), "0", "9223372036854775807")]
    public long Gem { get; set; }
}

[Serializable]
public class UpsertUserSeedPackageDto
{
    [Range(1, int.MaxValue)]
    public int TreePoolId { get; set; }

    [Range(0, int.MaxValue)]
    public int Quantity { get; set; }
}
