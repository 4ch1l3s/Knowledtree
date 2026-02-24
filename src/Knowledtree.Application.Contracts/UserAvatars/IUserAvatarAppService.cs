using System;
using System.Threading.Tasks;
using Volo.Abp.Application.Services;

namespace Knowledtree.UserAvatars;

/// <summary>
/// Service quản lý ảnh đại diện người dùng
/// </summary>
public interface IUserAvatarAppService : IApplicationService
{
    /// <summary>
    /// Lấy ảnh đại diện của người dùng theo UserId
    /// </summary>
    Task<UserAvatarDto?> GetAvatarAsync(Guid userId);

    /// <summary>
    /// Lấy ảnh đại diện của người dùng hiện tại
    /// </summary>
    Task<UserAvatarDto?> GetMyAvatarAsync();

    /// <summary>
    /// Upload hoặc thay thế ảnh đại diện của người dùng hiện tại
    /// </summary>
    Task<UserAvatarDto> UploadAvatarAsync(UserAvatarUploadDto input);

    /// <summary>
    /// Upload hoặc thay thế ảnh đại diện của user khác (admin)
    /// </summary>
    Task<UserAvatarDto> UploadAvatarForUserAsync(Guid userId, UserAvatarUploadDto input);

    /// <summary>
    /// Xóa ảnh đại diện của người dùng hiện tại
    /// </summary>
    Task DeleteAvatarAsync();
}
