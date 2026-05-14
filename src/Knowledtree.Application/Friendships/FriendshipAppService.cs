using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp.Users;

namespace Knowledtree.Friendships;

/// <summary>
/// Service CRUD quan he ban be - yeu cau dang nhap
/// </summary>
[Authorize]
public class FriendshipAppService : KnowledtreeAppService, IFriendshipAppService
{
    private readonly FriendshipManager _friendshipManager;
    private readonly IFriendshipRepository _friendshipRepository;

    public FriendshipAppService(
        FriendshipManager friendshipManager,
        IFriendshipRepository friendshipRepository)
    {
        _friendshipManager = friendshipManager;
        _friendshipRepository = friendshipRepository;
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
    public virtual async Task<List<FriendshipDto>> GetMyFriendsAsync()
    {
        var userId = CurrentUser.GetId();
        var list = await _friendshipRepository.GetAcceptedListAsync(userId);
        return ObjectMapper.Map<List<Friendship>, List<FriendshipDto>>(list);
    }

    /// <summary>
    /// Lay danh sach loi moi dang cho (nguoi khac gui cho minh)
    /// </summary>
    public virtual async Task<List<FriendshipDto>> GetPendingRequestsAsync()
    {
        var userId = CurrentUser.GetId();
        var list = await _friendshipRepository.GetPendingReceivedListAsync(userId);
        return ObjectMapper.Map<List<Friendship>, List<FriendshipDto>>(list);
    }

    /// <summary>
    /// Lay danh sach loi moi minh da gui
    /// </summary>
    public virtual async Task<List<FriendshipDto>> GetSentRequestsAsync()
    {
        var userId = CurrentUser.GetId();
        var list = await _friendshipRepository.GetPendingSentListAsync(userId);
        return ObjectMapper.Map<List<Friendship>, List<FriendshipDto>>(list);
    }
}
