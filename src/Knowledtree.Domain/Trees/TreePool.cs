using System;
using Volo.Abp.Domain.Entities;

namespace Knowledtree.Trees;

public class TreePool : AggregateRoot<int>
{
    public virtual string Name { get; protected set; } = null!;

    public virtual TreePoolType PoolType { get; protected set; }

    public virtual CurrencyType CurrencyType { get; protected set; }

    public virtual int Cost { get; protected set; }

    public virtual decimal CommonRate { get; protected set; }

    public virtual decimal RareRate { get; protected set; }

    public virtual decimal GoldRate { get; protected set; }

    public virtual DateTime? StartTime { get; protected set; }

    public virtual DateTime? EndTime { get; protected set; }

    public virtual bool IsActive { get; protected set; }

    protected TreePool()
    {
    }

    public TreePool(
        string name,
        TreePoolType poolType,
        CurrencyType currencyType,
        int cost,
        decimal commonRate,
        decimal rareRate,
        decimal goldRate,
        DateTime? startTime,
        DateTime? endTime,
        bool isActive)
    {
        Name = name;
        PoolType = poolType;
        CurrencyType = currencyType;
        Cost = cost;
        CommonRate = commonRate;
        RareRate = rareRate;
        GoldRate = goldRate;
        StartTime = startTime;
        EndTime = endTime;
        IsActive = isActive;
    }
}
