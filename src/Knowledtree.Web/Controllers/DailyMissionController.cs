using System;
using System.Threading.Tasks;
using Knowledtree.DailyMissions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp.AspNetCore.Mvc;

namespace Knowledtree.Web.Controllers;

[Route("api/daily-missions")]
[Authorize]
[IgnoreAntiforgeryToken]
public class DailyMissionController : AbpControllerBase
{
    private readonly IDailyMissionAppService _dailyMissionAppService;

    public DailyMissionController(IDailyMissionAppService dailyMissionAppService)
    {
        _dailyMissionAppService = dailyMissionAppService;
    }

    [HttpGet("today")]
    public virtual async Task<IActionResult> GetToday()
    {
        return Ok(await _dailyMissionAppService.GetTodayAsync());
    }

    [HttpPost("{id}/claim")]
    public virtual async Task<IActionResult> Claim(Guid id)
    {
        return Ok(await _dailyMissionAppService.ClaimAsync(id));
    }
}
