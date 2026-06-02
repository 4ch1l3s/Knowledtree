using System;

namespace Knowledtree.Friendships;

[Serializable]
public class FriendCandidateDto
{
    public Guid Id { get; set; }

    public string UserName { get; set; } = string.Empty;

    public string DisplayName { get; set; } = string.Empty;

    public string Initials { get; set; } = string.Empty;

    public string? AvatarBase64Content { get; set; }

    public string? AvatarContentType { get; set; }
}
