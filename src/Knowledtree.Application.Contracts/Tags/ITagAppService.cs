using System.Collections.Generic;
using System.Threading.Tasks;
using Volo.Abp.Application.Services;

namespace Knowledtree.Tags;

/// <summary>
/// Service quan ly tags cua nguoi dung
/// </summary>
public interface ITagAppService : IApplicationService
{
    /// <summary>
    /// Lay danh sach tags cua nguoi dung hien tai
    /// </summary>
    Task<List<TagDto>> GetMyTagsAsync();

    /// <summary>
    /// Tao tag moi
    /// </summary>
    Task<TagDto> CreateAsync(CreateUpdateTagDto input);

    /// <summary>
    /// Cap nhat tag
    /// </summary>
    Task<TagDto> UpdateAsync(int id, CreateUpdateTagDto input);

    /// <summary>
    /// Xoa tag
    /// </summary>
    Task DeleteAsync(int id);
}
