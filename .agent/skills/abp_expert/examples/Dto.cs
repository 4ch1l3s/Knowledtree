// ============================================================
// EXAMPLE: DTOs — based on ABP official DTO best practices
// Location: src/Knowledtree.Application.Contracts/Books/
// ============================================================

using System;
using System.ComponentModel.DataAnnotations;
using Volo.Abp.Application.Dtos;

namespace Knowledtree.Books
{
    // ----- OUTPUT DTO -----
    // File: BookDto.cs

    /// <summary>
    /// Output DTO for Book. Uses Extensible variant because Book is an Aggregate Root.
    /// This allows the object extension system to work correctly.
    /// </summary>
    [Serializable]
    public class BookDto : ExtensibleFullAuditedEntityDto<Guid>
    {
        public string Title { get; set; }
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public Guid AuthorId { get; set; }
    }


    // ----- INPUT DTO (Create/Update) -----
    // File: CreateUpdateBookDto.cs

    /// <summary>
    /// Input DTO for creating or updating a Book.
    /// Uses data annotations for validation.
    /// </summary>
    [Serializable]
    public class CreateUpdateBookDto
    {
        [Required]
        [StringLength(BookConsts.MaxTitleLength)]
        public string Title { get; set; }

        [StringLength(BookConsts.MaxDescriptionLength)]
        public string? Description { get; set; }

        [Required]
        [Range(typeof(decimal), "0", "79228162514264337593543950335")] // Max decimal value
        public decimal Price { get; set; }

        [Required]
        public Guid AuthorId { get; set; }
    }


    // ----- CONSTANTS (in Domain.Shared) -----
    // File: src/Knowledtree.Domain.Shared/Books/BookConsts.cs

    public static class BookConsts
    {
        public const int MaxTitleLength = 256;
        public const int MaxDescriptionLength = 2000;
    }
}
