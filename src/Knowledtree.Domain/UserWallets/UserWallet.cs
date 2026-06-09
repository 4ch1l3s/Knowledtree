using System;
using Volo.Abp.Auditing;
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
}
