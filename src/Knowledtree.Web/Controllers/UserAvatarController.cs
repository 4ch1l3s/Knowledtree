using System;
using System.Threading.Tasks;
using Knowledtree.UserAvatars;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Volo.Abp.AspNetCore.Mvc;
using Volo.Abp.Users;

namespace Knowledtree.Web.Controllers;

/// <summary>
/// Controller phục vụ ảnh đại diện dưới dạng raw image (cho thẻ img src)
/// và xử lý upload từ web (multipart form)
/// </summary>
[Route("api/user-avatar")]
public class UserAvatarController : AbpControllerBase
{
    private readonly IUserAvatarAppService _userAvatarAppService;

    public UserAvatarController(IUserAvatarAppService userAvatarAppService)
    {
        _userAvatarAppService = userAvatarAppService;
    }

    private static readonly byte[] TransparentPixel = Convert.FromBase64String("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=");

    /// <summary>
    /// Trả ảnh đại diện dưới dạng file ảnh (cho img src)
    /// </summary>
    [HttpGet("{userId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetAvatar(Guid userId)
    {
        var avatar = await _userAvatarAppService.GetAvatarAsync(userId);

        if (avatar == null)
        {
            return NotFound();
        }

        Response.Headers["Cache-Control"] = "no-cache";
        var bytes = Convert.FromBase64String(avatar.Base64Content);
        return File(bytes, avatar.ContentType);
    }

    /// <summary>
    /// Trả ảnh đại diện của người dùng hiện tại (raw image cho web)
    /// </summary>
    [HttpGet("my")]
    [Authorize]
    public async Task<IActionResult> GetMyAvatar()
    {
        var avatar = await _userAvatarAppService.GetMyAvatarAsync();

        if (avatar == null)
        {
            return NotFound();
        }

        Response.Headers["Cache-Control"] = "no-cache";
        var bytes = Convert.FromBase64String(avatar.Base64Content);
        return File(bytes, avatar.ContentType);
    }

    /// <summary>
    /// Trả ảnh đại diện của người dùng hiện tại dưới dạng JSON DTO (cho mobile)
    /// </summary>
    [HttpGet("my/json")]
    [Authorize]
    [IgnoreAntiforgeryToken]
    public async Task<IActionResult> GetMyAvatarJson()
    {
        Logger.LogInformation("[Avatar DEBUG] GetMyAvatarJson HIT. Auth header: {Auth}",
            Request.Headers["Authorization"].ToString());

        var avatar = await _userAvatarAppService.GetMyAvatarAsync();

        if (avatar == null)
        {
            Logger.LogInformation("[Avatar DEBUG] GetMyAvatarJson - no avatar found");
            return NotFound();
        }

        Logger.LogInformation("[Avatar DEBUG] GetMyAvatarJson - returning avatar DTO");
        return Ok(avatar);
    }

    /// <summary>
    /// Upload ảnh đại diện từ mobile (JSON base64, client đã xử lý)
    /// </summary>
    [HttpPost("upload/mobile")]
    [Authorize]
    [IgnoreAntiforgeryToken]
    public async Task<IActionResult> UploadMobile([FromBody] UserAvatarUploadDto input)
    {
        Logger.LogInformation("[Avatar DEBUG] UploadMobile endpoint HIT");

        try
        {
            input.ProcessOnServer = false; // Mobile đã crop + resize
            var result = await _userAvatarAppService.UploadAvatarAsync(input);

            Logger.LogInformation("[Avatar DEBUG] UploadMobile OK");
            return Ok(result);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "[Avatar DEBUG] UploadMobile FAILED");
            throw;
        }
    }

    /// <summary>
    /// Upload ảnh đại diện từ web form (server auto-crop + resize)
    /// </summary>
    [HttpPost("upload")]
    [Authorize]
    public async Task<IActionResult> Upload([FromForm] IFormFile file)
    {
        Logger.LogInformation("[Avatar DEBUG] Upload endpoint HIT");

        if (file == null || file.Length == 0)
        {
            Logger.LogWarning("[Avatar DEBUG] File is null or empty");
            return BadRequest("Vui lòng chọn file ảnh.");
        }

        Logger.LogInformation("[Avatar DEBUG] File: {FileName}, Size: {Size}, Type: {Type}",
            file.FileName, file.Length, file.ContentType);

        try
        {
            using var stream = file.OpenReadStream();
            var bytes = new byte[file.Length];
            await stream.ReadExactlyAsync(bytes);

            Logger.LogInformation("[Avatar DEBUG] Calling AppService.UploadAvatarAsync...");

            var result = await _userAvatarAppService.UploadAvatarAsync(new UserAvatarUploadDto
            {
                Base64Content = Convert.ToBase64String(bytes),
                ContentType = file.ContentType,
                ProcessOnServer = true
            });

            Logger.LogInformation("[Avatar DEBUG] Upload OK, returning result");
            return Ok(result);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "[Avatar DEBUG] Upload FAILED with exception");
            throw;
        }
    }

    /// <summary>
    /// Xóa ảnh đại diện của user khác (admin only)
    /// </summary>
    [HttpDelete("{userId}")]
    [Authorize]
    public async Task<IActionResult> DeleteForUser(Guid userId)
    {
        Logger.LogInformation("[Avatar DEBUG] DeleteForUser endpoint HIT, userId={UserId}", userId);

        try
        {
            await _userAvatarAppService.DeleteAvatarForUserAsync(userId);
            Logger.LogInformation("[Avatar DEBUG] DeleteForUser OK for userId={UserId}", userId);
            return NoContent();
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "[Avatar DEBUG] DeleteForUser FAILED for userId={UserId}", userId);
            throw;
        }
    }
}
