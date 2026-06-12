using System;
using System.Collections.Generic;
using System.Linq;
using Volo.Abp;

namespace Knowledtree.Trees;

internal static class TreePoolValidationHelper
{
    public static void ValidatePoolInput(
        int cost,
        decimal commonRate,
        decimal rareRate,
        decimal goldRate,
        DateTime? startTime,
        DateTime? endTime)
    {
        if (cost < 0)
        {
            throw new BusinessException(KnowledtreeDomainErrorCodes.InvalidWalletAmount);
        }

        if (commonRate < 0 || rareRate < 0 || goldRate < 0 || commonRate + rareRate + goldRate != 100m)
        {
            throw new BusinessException(KnowledtreeDomainErrorCodes.InvalidTreePoolRates);
        }

        if (startTime.HasValue && endTime.HasValue && startTime.Value > endTime.Value)
        {
            throw new BusinessException(KnowledtreeDomainErrorCodes.InvalidTreePoolDateRange);
        }
    }

    public static void EnsureRequiredRarityItems(TreePool pool, IEnumerable<Tree> trees)
    {
        EnsureRequiredRarityItems(pool.CommonRate, pool.RareRate, pool.GoldRate, trees);
    }

    public static void EnsureRequiredRarityItems(
        decimal commonRate,
        decimal rareRate,
        decimal goldRate,
        IEnumerable<Tree> trees)
    {
        var rarities = trees.Select(x => x.Rarity).ToHashSet();

        if ((commonRate > 0 && !rarities.Contains(TreeRarity.Common))
            || (rareRate > 0 && !rarities.Contains(TreeRarity.Rare))
            || (goldRate > 0 && !rarities.Contains(TreeRarity.Gold)))
        {
            throw new BusinessException(KnowledtreeDomainErrorCodes.TreePoolMissingRarityItems);
        }
    }
}
