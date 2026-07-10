using System;
using System.Threading.Tasks;
using Knowledtree.Trees;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp.Application.Dtos;
using Volo.Abp.AspNetCore.Mvc;

namespace Knowledtree.Web.Controllers;

[Route("api/planting-sessions")]
[Authorize]
[IgnoreAntiforgeryToken]
public class PlantingSessionController : AbpControllerBase
{
    private const int DefaultHistoryPageSize = 30;

    private readonly IPlantingSessionAppService _plantingSessionAppService;

    public PlantingSessionController(IPlantingSessionAppService plantingSessionAppService)
    {
        _plantingSessionAppService = plantingSessionAppService;
    }

    [HttpPost("start")]
    public virtual async Task<IActionResult> Start([FromBody] StartPlantingSessionDto input)
    {
        return Ok(await _plantingSessionAppService.StartAsync(input));
    }

    [HttpPost("{id}/complete")]
    public virtual async Task<IActionResult> Complete(Guid id, [FromBody] CompletePlantingSessionDto input)
    {
        return Ok(await _plantingSessionAppService.CompleteAsync(id, input));
    }

    [HttpPost("{id}/fail")]
    public virtual async Task<IActionResult> Fail(Guid id, [FromBody] FailPlantingSessionDto input)
    {
        return Ok(await _plantingSessionAppService.FailAsync(id, input));
    }

    [HttpGet("active")]
    public virtual async Task<IActionResult> GetActive()
    {
        return Ok(await _plantingSessionAppService.GetActiveAsync());
    }

    [HttpGet("history")]
    public virtual async Task<IActionResult> GetHistory(
        [FromQuery] int skipCount = 0,
        [FromQuery] int maxResultCount = DefaultHistoryPageSize)
    {
        return Ok(await _plantingSessionAppService.GetHistoryAsync(
            new PagedResultRequestDto
            {
                SkipCount = skipCount,
                MaxResultCount = maxResultCount
            }));
    }
}
