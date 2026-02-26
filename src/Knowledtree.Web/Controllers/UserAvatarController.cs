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
    /// Trả ảnh đại diện của người dùng hiện tại
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
    /// Upload ảnh đại diện cho user khác (admin only)
    /// </summary>
    [HttpPost("upload/{userId}")]
    [Authorize]
    public async Task<IActionResult> UploadForUser(Guid userId, [FromForm] IFormFile file)
    {
        Logger.LogInformation("[Avatar DEBUG] UploadForUser endpoint HIT, userId={UserId}", userId);

        if (file == null || file.Length == 0)
        {
            Logger.LogWarning("[Avatar DEBUG] File is null or empty for userId={UserId}", userId);
            return BadRequest("Vui lòng chọn file ảnh.");
        }

        Logger.LogInformation("[Avatar DEBUG] File: {FileName}, Size: {Size}, Type: {Type}",
            file.FileName, file.Length, file.ContentType);

        try
        {
            using var stream = file.OpenReadStream();
            var bytes = new byte[file.Length];
            await stream.ReadExactlyAsync(bytes);

            Logger.LogInformation("[Avatar DEBUG] Calling AppService.UploadAvatarForUserAsync...");

            var result = await _userAvatarAppService.UploadAvatarForUserAsync(
                userId,
                new UserAvatarUploadDto
                {
                    Base64Content = Convert.ToBase64String(bytes),
                    ContentType = file.ContentType,
                    ProcessOnServer = true
                });

            Logger.LogInformation("[Avatar DEBUG] UploadForUser OK for userId={UserId}", userId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "[Avatar DEBUG] UploadForUser FAILED for userId={UserId}", userId);
            throw;
        }
    }
}
