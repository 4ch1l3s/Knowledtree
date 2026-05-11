using System;

namespace Knowledtree.Friendships;

/// <summary>
/// DTO tra ve thong tin quan he ban be
/// </summary>
[Serializable]
public class FriendshipDto
{
    public Guid Id { get; set; }

    /// <summary>
    /// Nguoi gui loi moi
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// Nguoi nhan loi moi
    /// </summary>
    public Guid FriendId { get; set; }

    public FriendshipStatus Status { get; set; }

    public DateTime CreationTime { get; set; }
}
