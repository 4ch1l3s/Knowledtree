using System;
using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace Knowledtree.Trees;

public class UserSeedPackage : AuditedAggregateRoot<Guid>
{
    public virtual Guid UserId { get; protected set; }

    public virtual int TreePoolId { get; protected set; }

    public virtual int Quantity { get; protected set; }

    protected UserSeedPackage()
    {
    }

    public UserSeedPackage(Guid id, Guid userId, int treePoolId, int quantity = 0)
        : base(id)
    {
        if (quantity < 0)
        {
            throw new BusinessException(KnowledtreeDomainErrorCodes.InvalidSeedPackageQuantity);
        }

        UserId = userId;
        TreePoolId = treePoolId;
        Quantity = quantity;
    }

    public virtual void Add(int quantity)
    {
        if (quantity <= 0)
        {
            throw new BusinessException(KnowledtreeDomainErrorCodes.InvalidSeedPackageQuantity);
        }

        Quantity += quantity;
    }

    public virtual void Consume(int quantity = 1)
    {
        if (quantity <= 0)
        {
            throw new BusinessException(KnowledtreeDomainErrorCodes.InvalidSeedPackageQuantity);
        }

        if (Quantity < quantity)
        {
            throw new BusinessException(KnowledtreeDomainErrorCodes.SeedPackageUnavailable);
        }

        Quantity -= quantity;
    }
}
