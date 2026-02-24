namespace Knowledtree.UserAvatars;

/// <summary>
/// Hằng số cho tính năng ảnh đại diện
/// </summary>
public static class UserAvatarConsts
{
    /// <summary>
    /// Chiều rộng ảnh sau khi xử lý (px)
    /// </summary>
    public const int AvatarWidth = 256;

    /// <summary>
    /// Chiều cao ảnh sau khi xử lý (px)
    /// </summary>
    public const int AvatarHeight = 256;

    /// <summary>
    /// Chất lượng nén JPEG (0-100)
    /// </summary>
    public const int JpegQuality = 80;

    /// <summary>
    /// Kích thước tối đa cho ảnh upload thô (5MB)
    /// </summary>
    public const int MaxUploadSizeInBytes = 5 * 1024 * 1024;

    /// <summary>
    /// Độ dài tối đa của ContentType
    /// </summary>
    public const int MaxContentTypeLength = 64;
}
