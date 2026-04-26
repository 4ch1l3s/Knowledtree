using System;
using System.ComponentModel.DataAnnotations;

namespace Knowledtree.Tags;

/// <summary>
/// DTO tao/cap nhat Tag
/// </summary>
[Serializable]
public class CreateUpdateTagDto
{
    [Required]
    [StringLength(TagConsts.MaxNameLength)]
    public string Name { get; set; } = null!;

    [Required]
    [StringLength(TagConsts.MaxColorCodeLength)]
    public string ColorCode { get; set; } = null!;
}
