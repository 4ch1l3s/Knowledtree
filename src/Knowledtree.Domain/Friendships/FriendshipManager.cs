using System;
using System.Threading.Tasks;
using Volo.Abp;
using Volo.Abp.Domain.Services;

namespace Knowledtree.Friendships;

/// <summary>
/// Domain Service - xu ly logic nghiep vu ket ban
/// </summary>
public class FriendshipManager : DomainService
{
    private readonly IFriendshipRepository _friendshipRepository;

    public FriendshipManager(IFriendshipRepository friendshipRepository)
    {
        _friendshipRepository = friendshipRepository;
    }

    /// <summary>
    /// Gui loi moi ket ban
    /// </summary>
    public virtual async Task<Friendship> SendRequestAsync(Guid userId, Guid friendId)
    {
        // Khong cho tu ket ban voi chinh minh
        if (userId == friendId)
            throw new BusinessException(KnowledtreeDomainErrorCodes.CannotAddSelf);

        // Kiem tra da ton tai quan he chua (ca 2 chieu)
        var existing = await _friendshipRepository.FindByPairAsync(userId, friendId);
        if (existing != null)
            throw new BusinessException(KnowledtreeDomainErrorCodes.FriendshipAlreadyExists);

        // Kiem tra gioi han ban be cua nguoi gui
        var senderCount = await _friendshipRepository.CountAcceptedAsync(userId);
        if (senderCount >= FriendshipConsts.MaxFriendsCount)
            throw new BusinessException(KnowledtreeDomainErrorCodes.MaxFriendsLimitReached);

        // Kiem tra gioi han ban be cua nguoi nhan
        var receiverCount = await _friendshipRepository.CountAcceptedAsync(friendId);
        if (receiverCount >= FriendshipConsts.MaxFriendsCount)
            throw new BusinessException(KnowledtreeDomainErrorCodes.MaxFriendsLimitReached);

        var friendship = new Friendship(GuidGenerator.Create(), userId, friendId);
        return await _friendshipRepository.InsertAsync(friendship);
    }

    /// <summary>
    /// Dong y loi moi ket ban (chi nguoi nhan moi duoc dong y)
    /// </summary>
    public virtual async Task<Friendship> AcceptRequestAsync(Guid friendshipId, Guid currentUserId)
    {
        var friendship = await _friendshipRepository.GetAsync(friendshipId);

        // Chi nguoi nhan (FriendId) moi duoc accept
        if (friendship.FriendId != currentUserId)
            throw new BusinessException(KnowledtreeDomainErrorCodes.InvalidStatusTransition);

        if (friendship.Status != FriendshipStatus.Pending)
            throw new BusinessException(KnowledtreeDomainErrorCodes.InvalidStatusTransition);

        // Kiem tra gioi han truoc khi accept
        var count = await _friendshipRepository.CountAcceptedAsync(currentUserId);
        if (count >= FriendshipConsts.MaxFriendsCount)
            throw new BusinessException(KnowledtreeDomainErrorCodes.MaxFriendsLimitReached);

        friendship.Status = FriendshipStatus.Accepted;
        return await _friendshipRepository.UpdateAsync(friendship);
    }

    /// <summary>
    /// Tu choi loi moi (xoa record)
    /// </summary>
    public virtual async Task DeclineRequestAsync(Guid friendshipId, Guid currentUserId)
    {
        var friendship = await _friendshipRepository.GetAsync(friendshipId);

        // Chi nguoi nhan moi duoc tu choi
        if (friendship.FriendId != currentUserId)
            throw new BusinessException(KnowledtreeDomainErrorCodes.InvalidStatusTransition);

        if (friendship.Status != FriendshipStatus.Pending)
            throw new BusinessException(KnowledtreeDomainErrorCodes.InvalidStatusTransition);

        await _friendshipRepository.DeleteAsync(friendship);
    }

    /// <summary>
    /// Huy ket ban (ca 2 nguoi deu co the huy)
    /// </summary>
    public virtual async Task UnfriendAsync(Guid friendshipId, Guid currentUserId)
    {
        var friendship = await _friendshipRepository.GetAsync(friendshipId);

        // Ca 2 phia deu co the huy ket ban
        if (friendship.UserId != currentUserId && friendship.FriendId != currentUserId)
            throw new BusinessException(KnowledtreeDomainErrorCodes.FriendshipNotFound);

        if (friendship.Status != FriendshipStatus.Accepted)
            throw new BusinessException(KnowledtreeDomainErrorCodes.InvalidStatusTransition);

        await _friendshipRepository.DeleteAsync(friendship);
    }

    /// <summary>
    /// Huy loi moi da gui (chi nguoi gui moi duoc huy)
    /// </summary>
    public virtual async Task CancelRequestAsync(Guid friendshipId, Guid currentUserId)
    {
        var friendship = await _friendshipRepository.GetAsync(friendshipId);

        // Chi nguoi gui (UserId) moi duoc huy loi moi
        if (friendship.UserId != currentUserId)
            throw new BusinessException(KnowledtreeDomainErrorCodes.InvalidStatusTransition);

        if (friendship.Status != FriendshipStatus.Pending)
            throw new BusinessException(KnowledtreeDomainErrorCodes.InvalidStatusTransition);

        await _friendshipRepository.DeleteAsync(friendship);
    }
}
