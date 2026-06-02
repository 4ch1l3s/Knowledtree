using System;
using System.Threading.Tasks;
using Knowledtree.Friendships;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp.Application.Dtos;
using Volo.Abp.AspNetCore.Mvc;

namespace Knowledtree.Web.Controllers;

[Route("api/friendships")]
[Authorize]
[IgnoreAntiforgeryToken]
public class FriendshipController : AbpControllerBase
{
    private const int DefaultPageSize = 20;

    private readonly IFriendshipAppService _friendshipAppService;

    public FriendshipController(IFriendshipAppService friendshipAppService)
    {
        _friendshipAppService = friendshipAppService;
    }

    [HttpGet("candidates")]
    public virtual async Task<IActionResult> SearchCandidates(
        [FromQuery] string? filter = null,
        [FromQuery] int maxResultCount = 8)
    {
        var result = await _friendshipAppService.SearchCandidatesAsync(filter, maxResultCount);
        return Ok(result);
    }

    [HttpGet("friends")]
    public virtual async Task<IActionResult> GetFriends(
        [FromQuery] int skipCount = 0,
        [FromQuery] int maxResultCount = DefaultPageSize)
    {
        var result = await _friendshipAppService.GetMyFriendsAsync(
            new PagedResultRequestDto
            {
                SkipCount = skipCount,
                MaxResultCount = maxResultCount
            });

        return Ok(result);
    }

    [HttpGet("requests")]
    public virtual async Task<IActionResult> GetRequests(
        [FromQuery] int skipCount = 0,
        [FromQuery] int maxResultCount = DefaultPageSize)
    {
        var result = await _friendshipAppService.GetPendingRequestsAsync(
            new PagedResultRequestDto
            {
                SkipCount = skipCount,
                MaxResultCount = maxResultCount
            });

        return Ok(result);
    }

    [HttpGet("pending")]
    public virtual async Task<IActionResult> GetPending(
        [FromQuery] int skipCount = 0,
        [FromQuery] int maxResultCount = DefaultPageSize)
    {
        var result = await _friendshipAppService.GetSentRequestsAsync(
            new PagedResultRequestDto
            {
                SkipCount = skipCount,
                MaxResultCount = maxResultCount
            });

        return Ok(result);
    }

    [HttpPost("requests")]
    public virtual async Task<IActionResult> SendRequest([FromBody] SendFriendRequestDto input)
    {
        var result = await _friendshipAppService.SendRequestAsync(input);
        return Ok(result);
    }

    [HttpPost("{id}/accept")]
    public virtual async Task<IActionResult> Accept(Guid id)
    {
        var result = await _friendshipAppService.AcceptRequestAsync(id);
        return Ok(result);
    }

    [HttpPost("{id}/decline")]
    public virtual async Task<IActionResult> Decline(Guid id)
    {
        await _friendshipAppService.DeclineRequestAsync(id);
        return NoContent();
    }

    [HttpPost("{id}/cancel")]
    public virtual async Task<IActionResult> Cancel(Guid id)
    {
        await _friendshipAppService.CancelRequestAsync(id);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public virtual async Task<IActionResult> Unfriend(Guid id)
    {
        await _friendshipAppService.UnfriendAsync(id);
        return NoContent();
    }
}
