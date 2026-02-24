using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;
using SkiaSharp;
using Volo.Abp;
using Volo.Abp.Users;

namespace Knowledtree.UserAvatars;

/// <summary>
/// Service xử lý ảnh đại diện người dùng.
/// Web upload: server auto-crop + resize.
/// Mobile upload: lưu trực tiếp (client đã xử lý).
/// </summary>
[RemoteService(IsEnabled = false)]
[Authorize]
public class UserAvatarAppService : KnowledtreeAppService, IUserAvatarAppService
{
    private readonly IUserAvatarRepository _userAvatarRepository;

    public UserAvatarAppService(IUserAvatarRepository userAvatarRepository)
    {
        _userAvatarRepository = userAvatarRepository;
    }

    /// <summary>
    /// Lấy ảnh đại diện theo UserId (cho phép truy cập không cần đăng nhập)
    /// </summary>
    [AllowAnonymous]
    public virtual async Task<UserAvatarDto?> GetAvatarAsync(Guid userId)
    {
        var avatar = await _userAvatarRepository.FindByUserIdAsync(userId);

        if (avatar == null)
        {
            return null;
        }

        return new UserAvatarDto
        {
            Base64Content = Convert.ToBase64String(avatar.Content),
            ContentType = avatar.ContentType
        };
    }

    /// <summary>
    /// Lấy ảnh đại diện của người dùng hiện tại (yêu cầu đăng nhập)
    /// </summary>
    public virtual async Task<UserAvatarDto?> GetMyAvatarAsync()
    {
        var userId = CurrentUser.GetId();
        return await GetAvatarAsync(userId);
    }

    /// <summary>
    /// Upload hoặc thay thế ảnh đại diện của người dùng hiện tại
    /// </summary>
    public virtual async Task<UserAvatarDto> UploadAvatarAsync(UserAvatarUploadDto input)
    {
        var userId = CurrentUser.GetId();
        return await SaveAvatarAsync(userId, input);
    }

    /// <summary>
    /// Upload hoặc thay thế ảnh đại diện của user khác (admin)
    /// </summary>
    [Authorize("AbpIdentity.Users.Update")]
    public virtual async Task<UserAvatarDto> UploadAvatarForUserAsync(
        Guid userId, UserAvatarUploadDto input)
    {
        return await SaveAvatarAsync(userId, input);
    }

    /// <summary>
    /// Logic chung: decode, xử lý ảnh (nếu cần), lưu vào DB
    /// </summary>
    private async Task<UserAvatarDto> SaveAvatarAsync(Guid userId, UserAvatarUploadDto input)
    {
        Logger.LogInformation("[Avatar DEBUG] SaveAvatarAsync called for userId={UserId}", userId);

        // Decode base64 thành byte array
        byte[] imageBytes;
        try
        {
            imageBytes = Convert.FromBase64String(input.Base64Content);
            Logger.LogInformation("[Avatar DEBUG] Decoded {ByteCount} bytes from base64", imageBytes.Length);
        }
        catch (FormatException)
        {
            Logger.LogError("[Avatar DEBUG] Base64 decode FAILED");
            throw new UserFriendlyException("Dữ liệu ảnh không hợp lệ (base64 sai định dạng).");
        }

        // Kiểm tra kích thước upload thô
        if (imageBytes.Length > UserAvatarConsts.MaxUploadSizeInBytes)
        {
            Logger.LogWarning("[Avatar DEBUG] File too large: {Size} bytes", imageBytes.Length);
            throw new UserFriendlyException(
                $"Kích thước ảnh vượt quá giới hạn ({UserAvatarConsts.MaxUploadSizeInBytes / 1024 / 1024}MB).");
        }

        byte[] processedBytes;
        string contentType;

        if (input.ProcessOnServer)
        {
            Logger.LogInformation("[Avatar DEBUG] Processing image on server (crop+resize)...");
            (processedBytes, contentType) = ProcessImage(imageBytes);
            Logger.LogInformation("[Avatar DEBUG] ProcessImage done: {InputSize} → {OutputSize} bytes",
                imageBytes.Length, processedBytes.Length);
        }
        else
        {
            Logger.LogInformation("[Avatar DEBUG] Skipping server processing (mobile upload)");
            processedBytes = imageBytes;
            contentType = input.ContentType;
        }

        // Tìm avatar hiện tại hoặc tạo mới
        var existingAvatar = await _userAvatarRepository.FindByUserIdAsync(userId);
        Logger.LogInformation("[Avatar DEBUG] Existing avatar found: {Found}", existingAvatar != null);

        if (existingAvatar != null)
        {
            existingAvatar.SetContent(processedBytes, contentType);
            await _userAvatarRepository.UpdateAsync(existingAvatar);
            Logger.LogInformation("[Avatar DEBUG] Updated existing avatar in DB");
        }
        else
        {
            var newAvatar = new UserAvatar(
                GuidGenerator.Create(),
                userId,
                processedBytes,
                contentType
            );
            await _userAvatarRepository.InsertAsync(newAvatar);
            Logger.LogInformation("[Avatar DEBUG] Inserted new avatar in DB");
        }

        Logger.LogInformation("[Avatar DEBUG] SaveAvatarAsync completed successfully for userId={UserId}", userId);

        return new UserAvatarDto
        {
            Base64Content = Convert.ToBase64String(processedBytes),
            ContentType = contentType
        };
    }

    /// <summary>
    /// Xóa ảnh đại diện của người dùng hiện tại
    /// </summary>
    public virtual async Task DeleteAvatarAsync()
    {
        var userId = CurrentUser.GetId();
        var avatar = await _userAvatarRepository.FindByUserIdAsync(userId);

        if (avatar != null)
        {
            await _userAvatarRepository.DeleteAsync(avatar);
        }
    }

    /// <summary>
    /// Xử lý ảnh: crop vuông từ trung tâm → resize 256x256 → nén JPEG 80%
    /// </summary>
    private static (byte[] bytes, string contentType) ProcessImage(byte[] rawBytes)
    {
        using var inputStream = new SKMemoryStream(rawBytes);
        using var originalBitmap = SKBitmap.Decode(inputStream)
            ?? throw new UserFriendlyException("Không thể đọc ảnh. Vui lòng chọn ảnh JPEG hoặc PNG.");

        // Tính toán vùng crop vuông từ trung tâm
        int size = Math.Min(originalBitmap.Width, originalBitmap.Height);
        int cropX = (originalBitmap.Width - size) / 2;
        int cropY = (originalBitmap.Height - size) / 2;

        var cropRect = new SKRectI(cropX, cropY, cropX + size, cropY + size);

        // Crop vuông
        using var croppedBitmap = new SKBitmap(size, size);
        using (var canvas = new SKCanvas(croppedBitmap))
        {
            canvas.DrawBitmap(
                originalBitmap,
                cropRect,
                new SKRect(0, 0, size, size));
        }

        // Resize về kích thước chuẩn
        using var resizedBitmap = croppedBitmap.Resize(
            new SKImageInfo(UserAvatarConsts.AvatarWidth, UserAvatarConsts.AvatarHeight),
            SKFilterQuality.High);

        if (resizedBitmap == null)
        {
            throw new UserFriendlyException("Lỗi khi xử lý ảnh.");
        }

        // Encode sang JPEG
        using var image = SKImage.FromBitmap(resizedBitmap);
        using var data = image.Encode(SKEncodedImageFormat.Jpeg, UserAvatarConsts.JpegQuality);

        return (data.ToArray(), "image/jpeg");
    }
}
