using System.Threading.Tasks;
using Knowledtree.DailyMissions;
using Knowledtree.Permissions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp.AspNetCore.Mvc;

namespace Knowledtree.Web.Controllers;

[Route("api/admin/daily-missions")]
[Authorize(KnowledtreePermissions.DailyMissions.Default)]
[IgnoreAntiforgeryToken]
public class AdminDailyMissionController : AbpControllerBase
{
    private readonly IAdminDailyMissionAppService _dailyMissionAppService;

    public AdminDailyMissionController(IAdminDailyMissionAppService dailyMissionAppService)
    {
        _dailyMissionAppService = dailyMissionAppService;
    }

    [HttpGet]
    public virtual async Task<IActionResult> GetList()
    {
        return Ok(await _dailyMissionAppService.GetListAsync());
    }

    [HttpGet("{id}")]
    public virtual async Task<IActionResult> Get(int id)
    {
        return Ok(await _dailyMissionAppService.GetAsync(id));
    }

    [HttpPost]
    public virtual async Task<IActionResult> Create([FromBody] CreateUpdateDailyMissionDto input)
    {
        return Ok(await _dailyMissionAppService.CreateAsync(input));
    }

    [HttpPut("{id}")]
    public virtual async Task<IActionResult> Update(int id, [FromBody] CreateUpdateDailyMissionDto input)
    {
        return Ok(await _dailyMissionAppService.UpdateAsync(id, input));
    }

    [HttpDelete("{id}")]
    public virtual async Task<IActionResult> Delete(int id)
    {
        await _dailyMissionAppService.DeleteAsync(id);
        return NoContent();
    }
}
