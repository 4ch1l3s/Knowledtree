using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Knowledtree.Friendships;
using Shouldly;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Identity;
using Volo.Abp.Security.Claims;
using Xunit;

namespace Knowledtree.EntityFrameworkCore.Applications;

public class FriendshipAppServiceTests : KnowledtreeEntityFrameworkCoreTestBase
{
    private static readonly Guid CurrentUserId =
        Guid.Parse("2e701e62-0953-4dd3-910b-dc6cc93ccb0d");

    private readonly IFriendshipAppService _friendshipAppService;
    private readonly IdentityUserManager _identityUserManager;
    private readonly ICurrentPrincipalAccessor _currentPrincipalAccessor;

    public FriendshipAppServiceTests()
    {
        _friendshipAppService = GetRequiredService<IFriendshipAppService>();
        _identityUserManager = GetRequiredService<IdentityUserManager>();
        _currentPrincipalAccessor = GetRequiredService<ICurrentPrincipalAccessor>();
    }

    [Fact]
    public async Task Friendship_Request_Should_Appear_For_Both_Users_And_Be_Accepted()
    {
        var friend = await CreateUserAsync("friend");

        var candidates = await _friendshipAppService.SearchCandidatesAsync(friend.UserName);
        candidates.ShouldContain(x => x.Id == friend.Id);

        var request = await _friendshipAppService.SendRequestAsync(
            new SendFriendRequestDto { FriendId = friend.Id });

        request.UserId.ShouldBe(CurrentUserId);
        request.FriendId.ShouldBe(friend.Id);
        request.Status.ShouldBe(FriendshipStatus.Pending);

        var sentRequests = await _friendshipAppService.GetSentRequestsAsync(
            new PagedResultRequestDto());
        sentRequests.Items.ShouldContain(x => x.Id == request.Id);

        using (ChangeCurrentUser(friend))
        {
            var pendingRequests = await _friendshipAppService.GetPendingRequestsAsync(
                new PagedResultRequestDto());
            pendingRequests.Items.ShouldContain(x =>
                x.Id == request.Id && x.OtherUserId == CurrentUserId);

            var accepted = await _friendshipAppService.AcceptRequestAsync(request.Id);
            accepted.Status.ShouldBe(FriendshipStatus.Accepted);

            var friends = await _friendshipAppService.GetMyFriendsAsync(
                new PagedResultRequestDto());
            friends.Items.ShouldContain(x =>
                x.Id == request.Id && x.OtherUserId == CurrentUserId);
        }
    }

    [Fact]
    public async Task SendRequest_Should_Reject_Adding_Current_User()
    {
        var exception = await Should.ThrowAsync<BusinessException>(() =>
            _friendshipAppService.SendRequestAsync(
                new SendFriendRequestDto { FriendId = CurrentUserId }));

        exception.Code.ShouldBe(KnowledtreeDomainErrorCodes.CannotAddSelf);
    }

    private async Task<IdentityUser> CreateUserAsync(string prefix)
    {
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var userName = $"{prefix}-{suffix}";
        var user = new IdentityUser(
            Guid.NewGuid(),
            userName,
            $"{userName}@test.local");

        var result = await _identityUserManager.CreateAsync(user);
        result.Succeeded.ShouldBeTrue();

        return user;
    }

    private IDisposable ChangeCurrentUser(IdentityUser user)
    {
        var identity = new ClaimsIdentity(
        [
            new Claim(AbpClaimTypes.UserId, user.Id.ToString()),
            new Claim(AbpClaimTypes.UserName, user.UserName),
            new Claim(AbpClaimTypes.Email, user.Email ?? $"{user.UserName}@test.local")
        ], "Test");

        return _currentPrincipalAccessor.Change(new ClaimsPrincipal(identity));
    }
}
