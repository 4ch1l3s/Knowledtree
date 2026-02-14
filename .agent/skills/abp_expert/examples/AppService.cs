// ============================================================
// EXAMPLE: Application Service — based on ABP official best practices
// Location: src/Knowledtree.Application.Contracts/Books/IBookAppService.cs
//           src/Knowledtree.Application/Books/BookAppService.cs
// ============================================================

// ----- INTERFACE (in Application.Contracts) -----

namespace Knowledtree.Books
{
    using System;
    using System.Threading.Tasks;
    using Volo.Abp.Application.Dtos;
    using Volo.Abp.Application.Services;

    /// <summary>
    /// AppService interface for Book aggregate root.
    /// - Inherits IApplicationService.
    /// - Uses AppService postfix.
    /// - Only DTOs for inputs/outputs, never entities.
    /// </summary>
    public interface IBookAppService : IApplicationService
    {
        Task<BookDto> GetAsync(Guid id);
        Task<PagedResultDto<BookDto>> GetListAsync(PagedAndSortedResultRequestDto input);
        Task<BookDto> CreateAsync(CreateUpdateBookDto input);
        Task<BookDto> UpdateAsync(Guid id, CreateUpdateBookDto input);
        Task DeleteAsync(Guid id);
    }
}


// ----- IMPLEMENTATION (in Application) -----

namespace Knowledtree.Books
{
    using System;
    using System.Collections.Generic;
    using System.Threading.Tasks;
    using Volo.Abp.Application.Dtos;

    /// <summary>
    /// BookAppService implementation.
    /// - Inherits KnowledtreeAppService (project base class).
    /// - Injects IBookRepository (specific, not generic).
    /// - All public methods are virtual.
    /// - No private methods — use protected virtual instead.
    /// </summary>
    public class BookAppService : KnowledtreeAppService, IBookAppService
    {
        private readonly IBookRepository _bookRepository;

        public BookAppService(IBookRepository bookRepository)
        {
            _bookRepository = bookRepository;
        }

        public virtual async Task<BookDto> GetAsync(Guid id)
        {
            var book = await _bookRepository.GetAsync(id);
            return ObjectMapper.Map<Book, BookDto>(book);
        }

        public virtual async Task<PagedResultDto<BookDto>> GetListAsync(
            PagedAndSortedResultRequestDto input)
        {
            var totalCount = await _bookRepository.GetCountAsync();
            var books = await _bookRepository.GetPagedListAsync(
                input.SkipCount,
                input.MaxResultCount,
                input.Sorting ?? nameof(Book.Title));

            return new PagedResultDto<BookDto>(
                totalCount,
                ObjectMapper.Map<List<Book>, List<BookDto>>(books));
        }

        public virtual async Task<BookDto> CreateAsync(CreateUpdateBookDto input)
        {
            var book = new Book(
                GuidGenerator.Create(), // Use IGuidGenerator, not Guid.NewGuid()
                input.Title,
                input.AuthorId,
                input.Price,
                input.Description);

            await _bookRepository.InsertAsync(book);

            return ObjectMapper.Map<Book, BookDto>(book);
        }

        public virtual async Task<BookDto> UpdateAsync(Guid id, CreateUpdateBookDto input)
        {
            var book = await _bookRepository.GetAsync(id);

            book.SetTitle(input.Title);
            book.SetAuthor(input.AuthorId);
            book.Price = input.Price;
            book.Description = input.Description;

            await _bookRepository.UpdateAsync(book); // Always call UpdateAsync explicitly

            return ObjectMapper.Map<Book, BookDto>(book);
        }

        public virtual async Task DeleteAsync(Guid id)
        {
            await _bookRepository.DeleteAsync(id);
        }
    }
}

// ----- AUTOMAPPER PROFILE -----
// Add this to: src/Knowledtree.Application/KnowledtreeApplicationAutoMapperProfile.cs

// CreateMap<Book, BookDto>();
