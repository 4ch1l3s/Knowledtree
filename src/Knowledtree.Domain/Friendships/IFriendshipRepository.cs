using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Volo.Abp.Domain.Repositories;

namespace Knowledtree.Friendships;

/// <summary>
/// Repository interface cho Friendship
/// </summary>
public interface IFriendshipRepository : IBasicRepository<Friendship, Guid>
{
    /// <summary>
    /// Tim quan he giua 2 user (ca 2 chieu)
    /// </summary>
    Task<Friendship?> FindByPairAsync(
        Guid userId, Guid friendId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Lay danh sach ban be da accepted cua 1 user
    /// </summary>
    Task<List<Friendship>> GetAcceptedListAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Lay danh sach loi moi dang cho (nguoi khac gui cho minh)
    /// </summary>
    Task<List<Friendship>> GetPendingReceivedListAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Lay danh sach loi moi minh da gui (dang cho)
    /// </summary>
    Task<List<Friendship>> GetPendingSentListAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Dem so ban be da accepted cua 1 user
    /// </summary>
    Task<int> CountAcceptedAsync(
        Guid userId,
        CancellationToken cancellationToken = default);
}
