// ============================================================
// EXAMPLE: Repository Interface + EF Core Implementation
// ============================================================

// ----- INTERFACE (in Domain layer) -----
// Location: src/Knowledtree.Domain/Books/IBookRepository.cs

namespace Knowledtree.Books
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Volo.Abp.Domain.Repositories;

    /// <summary>
    /// Repository interface for Book aggregate root.
    /// - Inherits IBasicRepository (NOT IRepository — avoids exposing IQueryable).
    /// - Define only domain-specific query methods here.
    /// </summary>
    public interface IBookRepository : IBasicRepository<Book, Guid>
    {
        Task<Book?> FindByTitleAsync(
            string title,
            bool includeDetails = true,
            CancellationToken cancellationToken = default);

        Task<List<Book>> GetListByAuthorAsync(
            Guid authorId,
            CancellationToken cancellationToken = default);
    }
}


// ----- IMPLEMENTATION (in EntityFrameworkCore layer) -----
// Location: src/Knowledtree.EntityFrameworkCore/Books/EfCoreBookRepository.cs

namespace Knowledtree.Books
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Knowledtree.EntityFrameworkCore;
    using Microsoft.EntityFrameworkCore;
    using Volo.Abp.Domain.Repositories.EntityFrameworkCore;
    using Volo.Abp.EntityFrameworkCore;

    public class EfCoreBookRepository
        : EfCoreRepository<KnowledtreeDbContext, Book, Guid>, IBookRepository
    {
        public EfCoreBookRepository(
            IDbContextProvider<KnowledtreeDbContext> dbContextProvider)
            : base(dbContextProvider)
        {
        }

        public async Task<Book?> FindByTitleAsync(
            string title,
            bool includeDetails = true,
            CancellationToken cancellationToken = default)
        {
            return await (await GetDbSetAsync())
                .IncludeDetails(includeDetails)
                .FirstOrDefaultAsync(
                    b => b.Title == title,
                    GetCancellationToken(cancellationToken));
        }

        public async Task<List<Book>> GetListByAuthorAsync(
            Guid authorId,
            CancellationToken cancellationToken = default)
        {
            return await (await GetDbSetAsync())
                .Where(b => b.AuthorId == authorId)
                .ToListAsync(GetCancellationToken(cancellationToken));
        }

        /// <summary>
        /// Override WithDetailsAsync to include sub-collections by default.
        /// </summary>
        public override async Task<IQueryable<Book>> WithDetailsAsync()
        {
            return (await GetQueryableAsync()).IncludeDetails();
        }
    }
}

// ----- IncludeDetails Extension -----
// Location: src/Knowledtree.EntityFrameworkCore/Books/BookEfCoreQueryableExtensions.cs

namespace Knowledtree.Books
{
    using System.Linq;
    using Microsoft.EntityFrameworkCore;

    public static class BookEfCoreQueryableExtensions
    {
        public static IQueryable<Book> IncludeDetails(
            this IQueryable<Book> queryable,
            bool include = true)
        {
            if (!include) return queryable;

            return queryable
                .Include(x => x.Tags);
        }
    }
}
