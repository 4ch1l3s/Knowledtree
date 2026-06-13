using System;
using System.Collections.Generic;
using System.Linq;
using Knowledtree.Trees;

namespace Knowledtree.Web.Pages.TreeManagement.TreePools;

public class TreePoolFormViewModel
{
    public string Prefix { get; set; } = null!;

    public string TreeIdsName { get; set; } = null!;

    public TreePoolDto? Pool { get; set; }

    public CreateUpdateTreePoolDto? Input { get; set; }

    public List<int>? SelectedTreeIds { get; set; }

    public List<TreeDto> Trees { get; set; } = [];

    public TreePoolType[] PoolTypes { get; set; } = [];

    public CurrencyType[] CurrencyTypes { get; set; } = [];

    public string? Name => Input?.Name ?? Pool?.Name;

    public TreePoolType PoolType => Input?.PoolType ?? Pool?.PoolType ?? TreePoolType.Default;

    public CurrencyType CurrencyType => Input?.CurrencyType ?? Pool?.CurrencyType ?? CurrencyType.Gold;

    public int Cost => Input?.Cost ?? Pool?.Cost ?? 0;

    public decimal CommonRate => Input?.CommonRate ?? Pool?.CommonRate ?? 100m;

    public decimal RareRate => Input?.RareRate ?? Pool?.RareRate ?? 0m;

    public decimal GoldRate => Input?.GoldRate ?? Pool?.GoldRate ?? 0m;

    public DateTime? StartTime => Input?.StartTime ?? Pool?.StartTime;

    public DateTime? EndTime => Input?.EndTime ?? Pool?.EndTime;

    public string? PackageImageKey => Input?.PackageImageKey ?? Pool?.PackageImageKey;

    public bool IsActive => Input?.IsActive ?? Pool?.IsActive == true;

    public bool ContainsTree(int treeId)
    {
        if (SelectedTreeIds != null)
        {
            return SelectedTreeIds.Contains(treeId);
        }

        return Pool?.Trees.Any(x => x.Id == treeId) == true;
    }
}
