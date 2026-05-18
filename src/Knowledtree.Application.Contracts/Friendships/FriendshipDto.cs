using System;
using Volo.Abp.Application.Dtos;

namespace Knowledtree.Friendships;

/// <summary>
/// DTO tra ve thong tin quan he ban be
/// </summary>
[Serializable]
public class FriendshipDto : EntityDto<Guid>
{
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

    public DateTime? LastModificationTime { get; set; }

    public Guid OtherUserId { get; set; }

    public string OtherUserName { get; set; } = string.Empty;

    public string OtherUserDisplayName { get; set; } = string.Empty;

    public string OtherUserInitials { get; set; } = string.Empty;

    public string? OtherUserAvatarBase64Content { get; set; }

    public string? OtherUserAvatarContentType { get; set; }
}
