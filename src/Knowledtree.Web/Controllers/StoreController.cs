using System.Threading.Tasks;
using Knowledtree.Trees;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp.AspNetCore.Mvc;

namespace Knowledtree.Web.Controllers;

[Route("api/store")]
[Authorize]
[IgnoreAntiforgeryToken]
public class StoreController : AbpControllerBase
{
    private readonly IStoreAppService _storeAppService;

    public StoreController(IStoreAppService storeAppService)
    {
        _storeAppService = storeAppService;
    }

    [HttpGet("wallet")]
    public virtual async Task<IActionResult> GetWallet()
    {
        return Ok(await _storeAppService.GetMyWalletAsync());
    }

    [HttpGet("tree-pools")]
    public virtual async Task<IActionResult> GetTreePools()
    {
        return Ok(await _storeAppService.GetAvailableTreePoolsAsync());
    }

    [HttpGet("seed-packages")]
    public virtual async Task<IActionResult> GetSeedPackages()
    {
        return Ok(await _storeAppService.GetMySeedPackagesAsync());
    }

    [HttpGet("my-trees")]
    public virtual async Task<IActionResult> GetMyTrees()
    {
        return Ok(await _storeAppService.GetMyTreesAsync());
    }

    [HttpGet("treepedia")]
    public virtual async Task<IActionResult> GetTreepedia()
    {
        return Ok(await _storeAppService.GetTreepediaAsync());
    }

    [HttpPost("tree-pools/{treePoolId}/buy")]
    public virtual async Task<IActionResult> BuySeedPackage(int treePoolId)
    {
        return Ok(await _storeAppService.BuySeedPackageAsync(treePoolId));
    }

    [HttpPost("seed-package-purchases/batch")]
    public virtual async Task<IActionResult> BuySeedPackages([FromBody] BuySeedPackagesDto input)
    {
        return Ok(await _storeAppService.BuySeedPackagesAsync(input));
    }
}
