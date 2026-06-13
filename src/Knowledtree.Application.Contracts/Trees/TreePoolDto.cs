using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Knowledtree.Trees;

[Serializable]
public class TreePoolDto
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public TreePoolType PoolType { get; set; }

    public CurrencyType CurrencyType { get; set; }

    public int Cost { get; set; }

    public decimal CommonRate { get; set; }

    public decimal RareRate { get; set; }

    public decimal GoldRate { get; set; }

    public DateTime? StartTime { get; set; }

    public DateTime? EndTime { get; set; }

    public bool IsActive { get; set; }

    public string? PackageImageKey { get; set; }

    public int OwnedSeedQuantity { get; set; }

    public List<TreeDto> Trees { get; set; } = [];
}

[Serializable]
public class CreateUpdateTreePoolDto
{
    [Required]
    [StringLength(TreePoolConsts.MaxNameLength)]
    public string Name { get; set; } = null!;

    [Required]
    public TreePoolType PoolType { get; set; }

    [Required]
    public CurrencyType CurrencyType { get; set; }

    [Range(0, int.MaxValue)]
    public int Cost { get; set; }

    [Range(0, 100)]
    public decimal CommonRate { get; set; }

    [Range(0, 100)]
    public decimal RareRate { get; set; }

    [Range(0, 100)]
    public decimal GoldRate { get; set; }

    public DateTime? StartTime { get; set; }

    public DateTime? EndTime { get; set; }

    public bool IsActive { get; set; }

    [StringLength(TreePoolConsts.MaxPackageImageKeyLength)]
    public string? PackageImageKey { get; set; }
}

[Serializable]
public class ReplaceTreePoolItemsDto
{
    [Required]
    public List<int> TreeIds { get; set; } = [];
}
