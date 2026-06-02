using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Knowledtree.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Volo.Abp.Domain.Repositories.EntityFrameworkCore;
using Volo.Abp.EntityFrameworkCore;

namespace Knowledtree.Friendships;

/// <summary>
/// Repository EF Core cho Friendship
/// </summary>
public class EfCoreFriendshipRepository
    : EfCoreRepository<KnowledtreeDbContext, Friendship, Guid>,
      IFriendshipRepository
{
    public EfCoreFriendshipRepository(
        IDbContextProvider<KnowledtreeDbContext> dbContextProvider)
        : base(dbContextProvider)
    {
    }

    /// <summary>
    /// Tim quan he giua 2 user (ca 2 chieu A-B hoac B-A)
    /// </summary>
    public virtual async Task<Friendship?> FindByPairAsync(
        Guid userId, Guid friendId,
        CancellationToken cancellationToken = default)
    {
        var dbSet = await GetDbSetAsync();
        return await dbSet.FirstOrDefaultAsync(
            x => (x.UserId == userId && x.FriendId == friendId)
              || (x.UserId == friendId && x.FriendId == userId),
            GetCancellationToken(cancellationToken));
    }

    public virtual async Task<List<Guid>> GetRelatedUserIdsAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var dbSet = await GetDbSetAsync();
        return await dbSet
            .Where(x => x.UserId == userId || x.FriendId == userId)
            .Select(x => x.UserId == userId ? x.FriendId : x.UserId)
            .ToListAsync(GetCancellationToken(cancellationToken));
    }

    /// <summary>
    /// Lay danh sach ban be da accepted (tim ca 2 chieu)
    /// </summary>
    public virtual async Task<List<Friendship>> GetAcceptedListAsync(
        Guid userId,
        int skipCount = 0,
        int maxResultCount = int.MaxValue,
        CancellationToken cancellationToken = default)
    {
        var dbSet = await GetDbSetAsync();
        return await dbSet
            .Where(x => x.Status == FriendshipStatus.Accepted
                && (x.UserId == userId || x.FriendId == userId))
            .OrderByDescending(x => x.LastModificationTime ?? x.CreationTime)
            .Skip(skipCount)
            .Take(maxResultCount)
            .ToListAsync(GetCancellationToken(cancellationToken));
    }

    /// <summary>
    /// Lay loi moi nguoi khac gui cho minh (minh la FriendId)
    /// </summary>
    public virtual async Task<List<Friendship>> GetPendingReceivedListAsync(
        Guid userId,
        int skipCount = 0,
        int maxResultCount = int.MaxValue,
        CancellationToken cancellationToken = default)
    {
        var dbSet = await GetDbSetAsync();
        return await dbSet
            .Where(x => x.FriendId == userId
                && x.Status == FriendshipStatus.Pending)
            .OrderByDescending(x => x.CreationTime)
            .Skip(skipCount)
            .Take(maxResultCount)
            .ToListAsync(GetCancellationToken(cancellationToken));
    }

    /// <summary>
    /// Lay loi moi minh da gui (minh la UserId)
    /// </summary>
    public virtual async Task<List<Friendship>> GetPendingSentListAsync(
        Guid userId,
        int skipCount = 0,
        int maxResultCount = int.MaxValue,
        CancellationToken cancellationToken = default)
    {
        var dbSet = await GetDbSetAsync();
        return await dbSet
            .Where(x => x.UserId == userId
                && x.Status == FriendshipStatus.Pending)
            .OrderByDescending(x => x.CreationTime)
            .Skip(skipCount)
            .Take(maxResultCount)
            .ToListAsync(GetCancellationToken(cancellationToken));
    }

    /// <summary>
    /// Dem so ban be da accepted cua 1 user
    /// </summary>
    public virtual async Task<int> CountAcceptedAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var dbSet = await GetDbSetAsync();
        return await dbSet
            .CountAsync(x => x.Status == FriendshipStatus.Accepted
                && (x.UserId == userId || x.FriendId == userId),
            GetCancellationToken(cancellationToken));
    }

    public virtual async Task<int> CountPendingReceivedAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var dbSet = await GetDbSetAsync();
        return await dbSet
            .CountAsync(x => x.FriendId == userId
                && x.Status == FriendshipStatus.Pending,
            GetCancellationToken(cancellationToken));
    }

    public virtual async Task<int> CountPendingSentAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var dbSet = await GetDbSetAsync();
        return await dbSet
            .CountAsync(x => x.UserId == userId
                && x.Status == FriendshipStatus.Pending,
            GetCancellationToken(cancellationToken));
    }
}
