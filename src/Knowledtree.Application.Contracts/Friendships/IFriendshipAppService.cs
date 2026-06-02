using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;

namespace Knowledtree.Friendships;

/// <summary>
/// Service quan ly quan he ban be
/// </summary>
public interface IFriendshipAppService : IApplicationService
{
    /// <summary>
    /// Gui loi moi ket ban
    /// </summary>
    Task<FriendshipDto> SendRequestAsync(SendFriendRequestDto input);

    /// <summary>
    /// Tim user co the gui loi moi ket ban
    /// </summary>
    Task<List<FriendCandidateDto>> SearchCandidatesAsync(string? filter, int maxResultCount = 8);

    /// <summary>
    /// Dong y loi moi ket ban
    /// </summary>
    Task<FriendshipDto> AcceptRequestAsync(Guid friendshipId);

    /// <summary>
    /// Tu choi loi moi ket ban
    /// </summary>
    Task DeclineRequestAsync(Guid friendshipId);

    /// <summary>
    /// Huy loi moi da gui
    /// </summary>
    Task CancelRequestAsync(Guid friendshipId);

    /// <summary>
    /// Huy ket ban
    /// </summary>
    Task UnfriendAsync(Guid friendshipId);

    /// <summary>
    /// Lay danh sach ban be (da accepted)
    /// </summary>
    Task<PagedResultDto<FriendshipDto>> GetMyFriendsAsync(PagedResultRequestDto input);

    /// <summary>
    /// Lay danh sach loi moi dang cho (nguoi khac gui cho minh)
    /// </summary>
    Task<PagedResultDto<FriendshipDto>> GetPendingRequestsAsync(PagedResultRequestDto input);

    /// <summary>
    /// Lay danh sach loi moi minh da gui
    /// </summary>
    Task<PagedResultDto<FriendshipDto>> GetSentRequestsAsync(PagedResultRequestDto input);
}
