using System;
using System.ComponentModel.DataAnnotations;

namespace Knowledtree.Friendships;

/// <summary>
/// DTO gui loi moi ket ban
/// </summary>
[Serializable]
public class SendFriendRequestDto
{
    [Required]
    public Guid FriendId { get; set; }
}
