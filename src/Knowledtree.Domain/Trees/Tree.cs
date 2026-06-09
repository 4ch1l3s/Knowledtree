using Volo.Abp.Domain.Entities;

namespace Knowledtree.Trees;

public class Tree : AggregateRoot<int>
{
    public virtual string Name { get; protected set; } = null!;

    public virtual string? Description { get; protected set; }

    public virtual TreeRarity Rarity { get; protected set; }

    public virtual string ImageKey { get; protected set; } = null!;

    public virtual int BaseGoldYield { get; protected set; }

    protected Tree()
    {
    }

    public Tree(
        string name,
        string? description,
        TreeRarity rarity,
        string imageKey,
        int baseGoldYield)
    {
        Name = name;
        Description = description;
        Rarity = rarity;
        ImageKey = imageKey;
        BaseGoldYield = baseGoldYield;
    }
}
