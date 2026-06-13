using System;
using System.ComponentModel.DataAnnotations;

namespace Knowledtree.Trees;

[Serializable]
public class TreeDto
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public TreeRarity Rarity { get; set; }

    public string ImageKey { get; set; } = null!;

    public int BaseGoldYield { get; set; }
}

[Serializable]
public class CreateUpdateTreeDto
{
    [Required]
    [StringLength(TreeConsts.MaxNameLength)]
    public string Name { get; set; } = null!;

    [StringLength(TreeConsts.MaxDescriptionLength)]
    public string? Description { get; set; }

    [Required]
    public TreeRarity Rarity { get; set; }

    [Required]
    [StringLength(TreeConsts.MaxImageKeyLength)]
    public string ImageKey { get; set; } = null!;

    [Range(0, int.MaxValue)]
    public int BaseGoldYield { get; set; }
}
