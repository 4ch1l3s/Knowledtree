using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Users;

namespace Knowledtree.Tags;

/// <summary>
/// Service CRUD tags - moi user chi thao tac voi tag cua minh
/// </summary>
[Authorize]
public class TagAppService : KnowledtreeAppService, ITagAppService
{
    private readonly ITagRepository _tagRepository;

    public TagAppService(ITagRepository tagRepository)
    {
        _tagRepository = tagRepository;
    }

    /// <summary>
    /// Lay danh sach tags cua user hien tai
    /// </summary>
    public virtual async Task<List<TagDto>> GetMyTagsAsync()
    {
        var userId = CurrentUser.GetId();
        var tags = await _tagRepository.GetListByUserIdAsync(userId);
        return ObjectMapper.Map<List<Tag>, List<TagDto>>(tags);
    }

    /// <summary>
    /// Tao tag moi cho user hien tai
    /// </summary>
    public virtual async Task<TagDto> CreateAsync(CreateUpdateTagDto input)
    {
        var userId = CurrentUser.GetId();

        var tag = new Tag(input.Name, input.ColorCode, userId);
        await _tagRepository.InsertAsync(tag, autoSave: true);

        return ObjectMapper.Map<Tag, TagDto>(tag);
    }

    /// <summary>
    /// Cap nhat tag (chi cho phep sua tag cua minh)
    /// </summary>
    public virtual async Task<TagDto> UpdateAsync(int id, CreateUpdateTagDto input)
    {
        var userId = CurrentUser.GetId();
        var tag = await _tagRepository.GetAsync(id);

        // Chi cho phep sua tag cua chinh minh
        if (tag.UserId != userId)
        {
            throw new UserFriendlyException("Ban khong co quyen sua tag nay.");
        }

        tag.Name = input.Name;
        tag.ColorCode = input.ColorCode;
        await _tagRepository.UpdateAsync(tag, autoSave: true);

        return ObjectMapper.Map<Tag, TagDto>(tag);
    }

    /// <summary>
    /// Xoa tag (chi cho phep xoa tag cua minh)
    /// </summary>
    public virtual async Task DeleteAsync(int id)
    {
        var userId = CurrentUser.GetId();
        var tag = await _tagRepository.GetAsync(id);

        // Chi cho phep xoa tag cua chinh minh
        if (tag.UserId != userId)
        {
            throw new UserFriendlyException("Ban khong co quyen xoa tag nay.");
        }

        await _tagRepository.DeleteAsync(tag);
    }
}
