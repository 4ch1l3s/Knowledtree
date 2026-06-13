using System;
using System.Threading.Tasks;
using Knowledtree.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp.AspNetCore.Mvc;
using Volo.Abp.Identity;

namespace Knowledtree.Web.Controllers;

[Route("api/admin/users/{userId}/balance")]
[Authorize(IdentityPermissions.Users.Update)]
[IgnoreAntiforgeryToken]
public class AdminUserBalanceController : AbpControllerBase
{
    private readonly IAdminUserBalanceAppService _adminUserBalanceAppService;

    public AdminUserBalanceController(IAdminUserBalanceAppService adminUserBalanceAppService)
    {
        _adminUserBalanceAppService = adminUserBalanceAppService;
    }

    [HttpGet]
    public virtual async Task<IActionResult> Get(Guid userId)
    {
        return Ok(await _adminUserBalanceAppService.GetAsync(userId));
    }

    [HttpPut("wallet")]
    public virtual async Task<IActionResult> UpdateWallet(Guid userId, [FromBody] UpdateUserWalletDto input)
    {
        return Ok(await _adminUserBalanceAppService.UpdateWalletAsync(userId, input));
    }

    [HttpPut("seed-packages")]
    public virtual async Task<IActionResult> UpsertSeedPackage(Guid userId, [FromBody] UpsertUserSeedPackageDto input)
    {
        return Ok(await _adminUserBalanceAppService.UpsertSeedPackageAsync(userId, input));
    }

    [HttpDelete("seed-packages/{treePoolId}")]
    public virtual async Task<IActionResult> DeleteSeedPackage(Guid userId, int treePoolId)
    {
        return Ok(await _adminUserBalanceAppService.DeleteSeedPackageAsync(userId, treePoolId));
    }
}
