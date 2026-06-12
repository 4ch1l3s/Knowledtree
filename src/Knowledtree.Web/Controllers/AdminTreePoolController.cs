using System.Threading.Tasks;
using Knowledtree.Permissions;
using Knowledtree.Trees;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp.AspNetCore.Mvc;

namespace Knowledtree.Web.Controllers;

[Route("api/admin/tree-pools")]
[Authorize(KnowledtreePermissions.TreeManagement.TreePools.Default)]
[IgnoreAntiforgeryToken]
public class AdminTreePoolController : AbpControllerBase
{
    private readonly IAdminTreePoolAppService _adminTreePoolAppService;

    public AdminTreePoolController(IAdminTreePoolAppService adminTreePoolAppService)
    {
        _adminTreePoolAppService = adminTreePoolAppService;
    }

    [HttpGet]
    public virtual async Task<IActionResult> GetList()
    {
        return Ok(await _adminTreePoolAppService.GetListAsync());
    }

    [HttpGet("{id}")]
    public virtual async Task<IActionResult> Get(int id)
    {
        return Ok(await _adminTreePoolAppService.GetAsync(id));
    }

    [HttpPost]
    public virtual async Task<IActionResult> Create([FromBody] CreateUpdateTreePoolDto input)
    {
        return Ok(await _adminTreePoolAppService.CreateAsync(input));
    }

    [HttpPut("{id}")]
    public virtual async Task<IActionResult> Update(int id, [FromBody] CreateUpdateTreePoolDto input)
    {
        return Ok(await _adminTreePoolAppService.UpdateAsync(id, input));
    }

    [HttpPut("{id}/items")]
    public virtual async Task<IActionResult> ReplaceItems(int id, [FromBody] ReplaceTreePoolItemsDto input)
    {
        return Ok(await _adminTreePoolAppService.ReplaceItemsAsync(id, input));
    }

    [HttpDelete("{id}")]
    public virtual async Task<IActionResult> Delete(int id)
    {
        await _adminTreePoolAppService.DeleteAsync(id);
        return NoContent();
    }
}
