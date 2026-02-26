using System;
using System.Threading;
using System.Threading.Tasks;
using Volo.Abp.Domain.Repositories;

namespace Knowledtree.UserAvatars;

/// <summary>
/// Repository interface cho UserAvatar
/// </summary>
public interface IUserAvatarRepository : IBasicRepository<UserAvatar, Guid>
{
    /// <summary>
    /// Tìm ảnh đại diện theo UserId
    /// </summary>
    Task<UserAvatar?> FindByUserIdAsync(
        Guid userId,
        CancellationToken cancellationToken = default);
}
