using System;
using Volo.Abp.Domain.Entities.Auditing;

namespace Knowledtree.Trees;

public class UserTree : AuditedAggregateRoot<Guid>
{
    public virtual Guid UserId { get; protected set; }

    public virtual int TreeId { get; protected set; }

    public virtual int? FirstObtainedFromPoolId { get; protected set; }

    public virtual DateTime FirstObtainedAt { get; protected set; }

    public virtual int TotalObtainedCount { get; protected set; }

    public virtual bool IsPlanted { get; protected set; }

    protected UserTree()
    {
    }

    public UserTree(
        Guid id,
        Guid userId,
        int treeId,
        int? firstObtainedFromPoolId,
        DateTime firstObtainedAt)
        : base(id)
    {
        UserId = userId;
        TreeId = treeId;
        FirstObtainedFromPoolId = firstObtainedFromPoolId;
        FirstObtainedAt = firstObtainedAt;
        TotalObtainedCount = 1;
        IsPlanted = false;
    }
}
