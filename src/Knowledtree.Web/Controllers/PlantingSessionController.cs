using System;
using System.Threading.Tasks;
using Knowledtree.Trees;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp.AspNetCore.Mvc;

namespace Knowledtree.Web.Controllers;

[Route("api/planting-sessions")]
[Authorize]
[IgnoreAntiforgeryToken]
public class PlantingSessionController : AbpControllerBase
{
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
}
