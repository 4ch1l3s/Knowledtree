namespace Knowledtree;

public static class KnowledtreeDomainErrorCodes
{
    /* You can add your business exception error codes here, as constants */

    // Friendship
    public const string FriendshipAlreadyExists = "Knowledtree:Friendship:00001";
    public const string CannotAddSelf = "Knowledtree:Friendship:00002";
    public const string FriendshipNotFound = "Knowledtree:Friendship:00003";
    public const string InvalidStatusTransition = "Knowledtree:Friendship:00004";
    public const string MaxFriendsLimitReached = "Knowledtree:Friendship:00005";
}
