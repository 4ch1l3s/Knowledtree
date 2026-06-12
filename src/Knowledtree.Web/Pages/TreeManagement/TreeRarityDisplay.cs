using Knowledtree.Trees;

namespace Knowledtree.Web.Pages.TreeManagement;

public static class TreeRarityDisplay
{
    public static string GetLabel(TreeRarity rarity)
    {
        return rarity.ToString();
    }

    public static string GetCssClass(TreeRarity rarity)
    {
        return rarity switch
        {
            TreeRarity.Common => "kt-rarity-common",
            TreeRarity.Rare => "kt-rarity-rare",
            TreeRarity.Gold => "kt-rarity-gold",
            _ => "kt-rarity-common"
        };
    }
}
