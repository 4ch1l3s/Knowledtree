using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Volo.Abp.Domain.Repositories;

namespace Knowledtree.Tags;

/// <summary>
/// Repository interface cho Tag
/// </summary>
public interface ITagRepository : IBasicRepository<Tag, int>
{
    /// <summary>
    /// Lay danh sach tag theo UserId
    /// </summary>
    Task<List<Tag>> GetListByUserIdAsync(
        Guid userId,
        CancellationToken cancellationToken = default);
}
