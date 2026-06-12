using System.Threading.Tasks;
using Knowledtree.Permissions;
using Knowledtree.Trees;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp.AspNetCore.Mvc;

namespace Knowledtree.Web.Controllers;

[Route("api/admin/trees")]
[Authorize(KnowledtreePermissions.TreeManagement.Trees.Default)]
[IgnoreAntiforgeryToken]
public class AdminTreeController : AbpControllerBase
{
    private readonly IAdminTreeAppService _adminTreeAppService;

    public AdminTreeController(IAdminTreeAppService adminTreeAppService)
    {
        _adminTreeAppService = adminTreeAppService;
    }

    [HttpGet]
    public virtual async Task<IActionResult> GetList()
    {
        return Ok(await _adminTreeAppService.GetListAsync());
    }

    [HttpGet("{id}")]
    public virtual async Task<IActionResult> Get(int id)
    {
        return Ok(await _adminTreeAppService.GetAsync(id));
    }

    [HttpPost]
    public virtual async Task<IActionResult> Create([FromBody] CreateUpdateTreeDto input)
    {
        return Ok(await _adminTreeAppService.CreateAsync(input));
    }

    [HttpPut("{id}")]
    public virtual async Task<IActionResult> Update(int id, [FromBody] CreateUpdateTreeDto input)
    {
        return Ok(await _adminTreeAppService.UpdateAsync(id, input));
    }

    [HttpDelete("{id}")]
    public virtual async Task<IActionResult> Delete(int id)
    {
        await _adminTreeAppService.DeleteAsync(id);
        return NoContent();
    }
}
