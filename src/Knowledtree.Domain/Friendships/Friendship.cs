using System;
using Volo.Abp.Domain.Entities.Auditing;

namespace Knowledtree.Friendships;

/// <summary>
/// Quan he ban be giua 2 user.
/// UserId = nguoi gui, FriendId = nguoi nhan.
/// </summary>
public class Friendship : AuditedAggregateRoot<Guid>
{
    /// <summary>
    /// Nguoi gui loi moi
    /// </summary>
    public virtual Guid UserId { get; protected set; }

    /// <summary>
    /// Nguoi nhan loi moi
    /// </summary>
    public virtual Guid FriendId { get; protected set; }

    /// <summary>
    /// Trang thai hien tai
    /// </summary>
    public virtual FriendshipStatus Status { get; set; }

    protected Friendship() { }

    public Friendship(Guid id, Guid userId, Guid friendId)
        : base(id)
    {
        UserId = userId;
        FriendId = friendId;
        Status = FriendshipStatus.Pending;
    }
}
