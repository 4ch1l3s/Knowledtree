using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Knowledtree.EntityFrameworkCore;
using Knowledtree.UserAvatars;
using Microsoft.EntityFrameworkCore;
using Volo.Abp.Domain.Repositories.EntityFrameworkCore;
using Volo.Abp.EntityFrameworkCore;

namespace Knowledtree.UserAvatars;

/// <summary>
/// Repository EF Core cho UserAvatar
/// </summary>
public class EfCoreUserAvatarRepository
    : EfCoreRepository<KnowledtreeDbContext, UserAvatar, Guid>,
      IUserAvatarRepository
{
    public EfCoreUserAvatarRepository(
        IDbContextProvider<KnowledtreeDbContext> dbContextProvider)
        : base(dbContextProvider)
    {
    }

    /// <summary>
    /// Tìm ảnh đại diện theo UserId
    /// </summary>
    public virtual async Task<UserAvatar?> FindByUserIdAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var dbSet = await GetDbSetAsync();
        return await dbSet
            .Where(x => x.UserId == userId)
            .FirstOrDefaultAsync(GetCancellationToken(cancellationToken));
    }
}
