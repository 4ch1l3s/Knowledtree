using System;
using Volo.Abp.Domain.Entities;

namespace Knowledtree.UserAvatars;

/// <summary>
/// Entity lưu trữ ảnh đại diện của người dùng.
/// Quan hệ 1-1 với IdentityUser thông qua UserId.
/// </summary>
public class UserAvatar : Entity<Guid>
{
    /// <summary>
    /// ID của người dùng sở hữu ảnh đại diện
    /// </summary>
    public virtual Guid UserId { get; protected set; }

    /// <summary>
    /// Nội dung ảnh dưới dạng byte array (đã qua xử lý: crop + resize)
    /// </summary>
    public virtual byte[] Content { get; protected set; } = null!;

    /// <summary>
    /// Loại nội dung ảnh (ví dụ: image/jpeg, image/png)
    /// </summary>
    public virtual string ContentType { get; protected set; } = null!;

    /// <summary>
    /// Constructor cho ORM
    /// </summary>
    protected UserAvatar()
    {
    }

    /// <summary>
    /// Tạo mới ảnh đại diện
    /// </summary>
    public UserAvatar(Guid id, Guid userId, byte[] content, string contentType)
        : base(id)
    {
        UserId = userId;
        SetContent(content, contentType);
    }

    /// <summary>
    /// Cập nhật nội dung ảnh đại diện
    /// </summary>
    public virtual void SetContent(byte[] content, string contentType)
    {
        Content = content ?? throw new ArgumentNullException(nameof(content));
        ContentType = contentType ?? throw new ArgumentNullException(nameof(contentType));
    }
}
