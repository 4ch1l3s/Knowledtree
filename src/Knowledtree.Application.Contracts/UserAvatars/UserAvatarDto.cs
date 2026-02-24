namespace Knowledtree.UserAvatars;

/// <summary>
/// DTO trả về ảnh đại diện dưới dạng base64
/// </summary>
public class UserAvatarDto
{
    /// <summary>
    /// Nội dung ảnh đã encode base64
    /// </summary>
    public string Base64Content { get; set; } = null!;

    /// <summary>
    /// Loại nội dung (image/jpeg, image/png)
    /// </summary>
    public string ContentType { get; set; } = null!;
}
