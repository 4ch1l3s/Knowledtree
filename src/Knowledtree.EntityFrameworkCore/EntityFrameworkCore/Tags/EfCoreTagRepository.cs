using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Knowledtree.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Volo.Abp.Domain.Repositories.EntityFrameworkCore;
using Volo.Abp.EntityFrameworkCore;

namespace Knowledtree.Tags;

/// <summary>
/// Repository EF Core cho Tag
/// </summary>
public class EfCoreTagRepository
    : EfCoreRepository<KnowledtreeDbContext, Tag, int>,
      ITagRepository
{
    public EfCoreTagRepository(
        IDbContextProvider<KnowledtreeDbContext> dbContextProvider)
        : base(dbContextProvider)
    {
    }

    /// <summary>
    /// Lay danh sach tag theo UserId, sap xep theo ngay tao moi nhat
    /// </summary>
    public virtual async Task<List<Tag>> GetListByUserIdAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var dbSet = await GetDbSetAsync();
        return await dbSet
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.CreationTime)
            .ToListAsync(GetCancellationToken(cancellationToken));
    }
}
