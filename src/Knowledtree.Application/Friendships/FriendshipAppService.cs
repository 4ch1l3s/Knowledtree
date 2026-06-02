using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Knowledtree.UserAvatars;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Identity;
using Volo.Abp.Users;

namespace Knowledtree.Friendships;

/// <summary>
/// Service CRUD quan he ban be - yeu cau dang nhap
/// </summary>
[Authorize]
public class FriendshipAppService : KnowledtreeAppService, IFriendshipAppService
{
    private const int DefaultPageSize = 20;
    private const int MaxPageSize = 20;

    private readonly FriendshipManager _friendshipManager;
    private readonly IFriendshipRepository _friendshipRepository;
    private readonly IIdentityUserRepository _identityUserRepository;
    private readonly IUserAvatarRepository _userAvatarRepository;

    public FriendshipAppService(
        FriendshipManager friendshipManager,
        IFriendshipRepository friendshipRepository,
        IIdentityUserRepository identityUserRepository,
        IUserAvatarRepository userAvatarRepository)
    {
        _friendshipManager = friendshipManager;
        _friendshipRepository = friendshipRepository;
        _identityUserRepository = identityUserRepository;
        _userAvatarRepository = userAvatarRepository;
    }

    /// <summary>
    /// Gui loi moi ket ban
    /// </summary>
    public virtual async Task<FriendshipDto> SendRequestAsync(SendFriendRequestDto input)
    {
        var userId = CurrentUser.GetId();
        var friendship = await _friendshipManager.SendRequestAsync(userId, input.FriendId);
        return ObjectMapper.Map<Friendship, FriendshipDto>(friendship);
    }

    /// <summary>
    /// Tim user co the gui loi moi ket ban
    /// </summary>
    public virtual async Task<List<FriendCandidateDto>> SearchCandidatesAsync(
        string? filter,
        int maxResultCount = 8)
    {
        var userId = CurrentUser.GetId();
        var normalizedFilter = filter?.Trim();
        var takeCount = Math.Clamp(maxResultCount, 1, 20);
        var relatedUserIds = await _friendshipRepository.GetRelatedUserIdsAsync(userId);
        var users = await _identityUserRepository.GetListAsync();

        var candidates = users
            .Where(user => user.Id != userId && !relatedUserIds.Contains(user.Id))
            .Where(user => MatchesCandidateFilter(user, normalizedFilter))
            .OrderBy(user => BuildDisplayName(user))
            .ThenBy(user => user.UserName)
            .Take(takeCount)
            .ToList();

        var result = new List<FriendCandidateDto>(candidates.Count);
        foreach (var user in candidates)
        {
            result.Add(await MapToCandidateDtoAsync(user));
        }

        return result;
    }

    /// <summary>
    /// Dong y loi moi ket ban
    /// </summary>
    public virtual async Task<FriendshipDto> AcceptRequestAsync(Guid friendshipId)
    {
        var userId = CurrentUser.GetId();
        var friendship = await _friendshipManager.AcceptRequestAsync(friendshipId, userId);
        return ObjectMapper.Map<Friendship, FriendshipDto>(friendship);
    }

    /// <summary>
    /// Tu choi loi moi ket ban
    /// </summary>
    public virtual async Task DeclineRequestAsync(Guid friendshipId)
    {
        var userId = CurrentUser.GetId();
        await _friendshipManager.DeclineRequestAsync(friendshipId, userId);
    }

    /// <summary>
    /// Huy loi moi da gui
    /// </summary>
    public virtual async Task CancelRequestAsync(Guid friendshipId)
    {
        var userId = CurrentUser.GetId();
        await _friendshipManager.CancelRequestAsync(friendshipId, userId);
    }

    /// <summary>
    /// Huy ket ban
    /// </summary>
    public virtual async Task UnfriendAsync(Guid friendshipId)
    {
        var userId = CurrentUser.GetId();
        await _friendshipManager.UnfriendAsync(friendshipId, userId);
    }

    /// <summary>
    /// Lay danh sach ban be (da accepted)
    /// </summary>
    public virtual async Task<PagedResultDto<FriendshipDto>> GetMyFriendsAsync(PagedResultRequestDto input)
    {
        var userId = CurrentUser.GetId();
        var paging = NormalizePaging(input);
        var totalCount = await _friendshipRepository.CountAcceptedAsync(userId);
        if (totalCount == 0)
        {
            return new PagedResultDto<FriendshipDto>(0, []);
        }

        var list = await _friendshipRepository.GetAcceptedListAsync(
            userId,
            paging.SkipCount,
            paging.MaxResultCount);

        return new PagedResultDto<FriendshipDto>(
            totalCount,
            await MapToDtosAsync(list, userId));
    }

    /// <summary>
    /// Lay danh sach loi moi dang cho (nguoi khac gui cho minh)
    /// </summary>
    public virtual async Task<PagedResultDto<FriendshipDto>> GetPendingRequestsAsync(PagedResultRequestDto input)
    {
        var userId = CurrentUser.GetId();
        var paging = NormalizePaging(input);
        var totalCount = await _friendshipRepository.CountPendingReceivedAsync(userId);
        if (totalCount == 0)
        {
            return new PagedResultDto<FriendshipDto>(0, []);
        }

        var list = await _friendshipRepository.GetPendingReceivedListAsync(
            userId,
            paging.SkipCount,
            paging.MaxResultCount);

        return new PagedResultDto<FriendshipDto>(
            totalCount,
            await MapToDtosAsync(list, userId));
    }

    /// <summary>
    /// Lay danh sach loi moi minh da gui
    /// </summary>
    public virtual async Task<PagedResultDto<FriendshipDto>> GetSentRequestsAsync(PagedResultRequestDto input)
    {
        var userId = CurrentUser.GetId();
        var paging = NormalizePaging(input);
        var totalCount = await _friendshipRepository.CountPendingSentAsync(userId);
        if (totalCount == 0)
        {
            return new PagedResultDto<FriendshipDto>(0, []);
        }

        var list = await _friendshipRepository.GetPendingSentListAsync(
            userId,
            paging.SkipCount,
            paging.MaxResultCount);

        return new PagedResultDto<FriendshipDto>(
            totalCount,
            await MapToDtosAsync(list, userId));
    }

    protected virtual (int SkipCount, int MaxResultCount) NormalizePaging(PagedResultRequestDto input)
    {
        var skipCount = Math.Max(input.SkipCount, 0);
        var maxResultCount = input.MaxResultCount <= 0
            ? DefaultPageSize
            : Math.Min(input.MaxResultCount, MaxPageSize);

        return (skipCount, maxResultCount);
    }

    protected virtual async Task<List<FriendshipDto>> MapToDtosAsync(
        List<Friendship> friendships,
        Guid currentUserId)
    {
        var result = new List<FriendshipDto>(friendships.Count);

        foreach (var friendship in friendships)
        {
            result.Add(await MapToDtoAsync(friendship, currentUserId));
        }

        return result;
    }

    protected virtual async Task<FriendshipDto> MapToDtoAsync(
        Friendship friendship,
        Guid currentUserId)
    {
        var dto = ObjectMapper.Map<Friendship, FriendshipDto>(friendship);
        var otherUserId = friendship.UserId == currentUserId
            ? friendship.FriendId
            : friendship.UserId;

        dto.OtherUserId = otherUserId;

        var user = await _identityUserRepository.FindAsync(otherUserId);
        dto.OtherUserName = user?.UserName ?? string.Empty;
        dto.OtherUserDisplayName = BuildDisplayName(user);
        dto.OtherUserInitials = BuildInitials(dto.OtherUserDisplayName);

        var avatar = await _userAvatarRepository.FindByUserIdAsync(otherUserId);
        if (avatar != null)
        {
            dto.OtherUserAvatarBase64Content = Convert.ToBase64String(avatar.Content);
            dto.OtherUserAvatarContentType = avatar.ContentType;
        }

        return dto;
    }

    protected virtual string BuildDisplayName(IdentityUser? user)
    {
        if (user == null)
        {
            return string.Empty;
        }

        var nameParts = new[] { user.Name, user.Surname }
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .ToList();

        return nameParts.Count > 0
            ? string.Join(" ", nameParts)
            : user.UserName;
    }

    protected virtual string BuildInitials(string displayName)
    {
        var parts = displayName
            .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        if (parts.Length == 0)
        {
            return "?";
        }

        if (parts.Length == 1)
        {
            return parts[0][0].ToString().ToUpperInvariant();
        }

        return string.Concat(parts[0][0], parts[^1][0]).ToUpperInvariant();
    }

    protected virtual bool MatchesCandidateFilter(IdentityUser user, string? filter)
    {
        if (string.IsNullOrWhiteSpace(filter))
        {
            return true;
        }

        return ContainsIgnoreCase(user.UserName, filter);
    }

    protected virtual bool ContainsIgnoreCase(string? value, string filter)
    {
        return !string.IsNullOrWhiteSpace(value)
            && value.Contains(filter, StringComparison.OrdinalIgnoreCase);
    }

    protected virtual async Task<FriendCandidateDto> MapToCandidateDtoAsync(IdentityUser user)
    {
        var displayName = BuildDisplayName(user);
        var dto = new FriendCandidateDto
        {
            Id = user.Id,
            UserName = user.UserName,
            DisplayName = displayName,
            Initials = BuildInitials(displayName)
        };

        var avatar = await _userAvatarRepository.FindByUserIdAsync(user.Id);
        if (avatar != null)
        {
            dto.AvatarBase64Content = Convert.ToBase64String(avatar.Content);
            dto.AvatarContentType = avatar.ContentType;
        }

        return dto;
    }
}
