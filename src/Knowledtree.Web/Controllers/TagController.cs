using System.Threading.Tasks;
using Knowledtree.Tags;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp.AspNetCore.Mvc;

namespace Knowledtree.Web.Controllers;

/// <summary>
/// Controller API cho Tags (CRUD)
/// </summary>
[Route("api/tags")]
[Authorize]
[IgnoreAntiforgeryToken]
public class TagController : AbpControllerBase
{
    private readonly ITagAppService _tagAppService;

    public TagController(ITagAppService tagAppService)
    {
        _tagAppService = tagAppService;
    }

    /// <summary>
    /// Lay danh sach tags cua user hien tai
    /// </summary>
    [HttpGet("my")]
    public virtual async Task<IActionResult> GetMyTags()
    {
        var tags = await _tagAppService.GetMyTagsAsync();
        return Ok(tags);
    }

    /// <summary>
    /// Tao tag moi
    /// </summary>
    [HttpPost]
    public virtual async Task<IActionResult> Create([FromBody] CreateUpdateTagDto input)
    {
        var tag = await _tagAppService.CreateAsync(input);
        return Ok(tag);
    }

    /// <summary>
    /// Cap nhat tag
    /// </summary>
    [HttpPut("{id}")]
    public virtual async Task<IActionResult> Update(int id, [FromBody] CreateUpdateTagDto input)
    {
        var tag = await _tagAppService.UpdateAsync(id, input);
        return Ok(tag);
    }

    /// <summary>
    /// Xoa tag
    /// </summary>
    [HttpDelete("{id}")]
    public virtual async Task<IActionResult> Delete(int id)
    {
        await _tagAppService.DeleteAsync(id);
        return NoContent();
    }
}
