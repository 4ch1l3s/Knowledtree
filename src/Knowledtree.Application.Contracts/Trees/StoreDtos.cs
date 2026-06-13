using System;

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
