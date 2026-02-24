using System.ComponentModel.DataAnnotations;

namespace Knowledtree.UserAvatars;

/// <summary>
/// DTO cho việc upload ảnh đại diện
/// </summary>
public class UserAvatarUploadDto
{
    /// <summary>
    /// Nội dung ảnh encode base64
    /// </summary>
    [Required]
    public string Base64Content { get; set; } = null!;

    /// <summary>
    /// Loại nội dung (image/jpeg, image/png)
    /// </summary>
    [Required]
    [MaxLength(UserAvatarConsts.MaxContentTypeLength)]
    public string ContentType { get; set; } = null!;

    /// <summary>
    /// True nếu server cần xử lý ảnh (crop + resize).
    /// Web gửi true, mobile gửi false (đã xử lý phía client).
    /// </summary>
    public bool ProcessOnServer { get; set; } = true;
}
