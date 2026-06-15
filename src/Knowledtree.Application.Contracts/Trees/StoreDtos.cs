using System;
using System.Collections.Generic;

namespace Knowledtree.Trees;

[Serializable]
public class WalletDto
{
    public long Coin { get; set; }

    public long Gem { get; set; }
}

[Serializable]
public class SeedPackageDto
{
    public Guid Id { get; set; }

    public int TreePoolId { get; set; }

    public string TreePoolName { get; set; } = null!;

    public string? PackageImageKey { get; set; }

    public int Quantity { get; set; }
}

[Serializable]
public class BuySeedPackageResultDto
{
    public WalletDto Wallet { get; set; } = null!;

    public SeedPackageDto SeedPackage { get; set; } = null!;
}

[Serializable]
public class BuySeedPackageItemDto
{
    public int TreePoolId { get; set; }

    public int Quantity { get; set; }
}

[Serializable]
public class BuySeedPackagesDto
{
    public List<BuySeedPackageItemDto> Items { get; set; } = [];
}

[Serializable]
public class BuySeedPackagesResultDto
{
    public WalletDto Wallet { get; set; } = null!;

    public List<SeedPackageDto> SeedPackages { get; set; } = [];
}
