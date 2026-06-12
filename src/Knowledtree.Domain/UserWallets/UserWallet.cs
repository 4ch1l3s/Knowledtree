using System;
using Volo.Abp.Auditing;
using Volo.Abp;
using Volo.Abp.Domain.Entities;

namespace Knowledtree.UserWallets;

public class UserWallet : Entity<Guid>, IHasCreationTime, IHasModificationTime
{
    public virtual Guid UserId { get; protected set; }

    public virtual long Coin { get; protected set; }

    public virtual long Gem { get; protected set; }

    public virtual DateTime CreationTime { get; set; }

    public virtual DateTime? LastModificationTime { get; set; }

    protected UserWallet()
    {
    }

    public UserWallet(Guid id, Guid userId, long coin = 0, long gem = 0)
        : base(id)
    {
        UserId = userId;
        Coin = coin;
        Gem = gem;
    }

    public virtual void DebitCoin(long amount)
    {
        CheckAmount(amount);

        if (Coin < amount)
        {
            throw new BusinessException(KnowledtreeDomainErrorCodes.InsufficientWalletBalance);
        }

        Coin -= amount;
    }

    public virtual void DebitGem(long amount)
    {
        CheckAmount(amount);

        if (Gem < amount)
        {
            throw new BusinessException(KnowledtreeDomainErrorCodes.InsufficientWalletBalance);
        }

        Gem -= amount;
    }

    public virtual void CreditCoin(long amount)
    {
        CheckAmount(amount);
        Coin += amount;
    }

    public virtual void CreditGem(long amount)
    {
        CheckAmount(amount);
        Gem += amount;
    }

    private static void CheckAmount(long amount)
    {
        if (amount < 0)
        {
            throw new BusinessException(KnowledtreeDomainErrorCodes.InvalidWalletAmount);
        }
    }
}
