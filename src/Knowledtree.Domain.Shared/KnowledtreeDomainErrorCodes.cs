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

    // Tree store
    public const string InsufficientWalletBalance = "Knowledtree:TreeStore:00001";
    public const string InvalidWalletAmount = "Knowledtree:TreeStore:00002";
    public const string InvalidSeedPackageQuantity = "Knowledtree:TreeStore:00003";
    public const string SeedPackageUnavailable = "Knowledtree:TreeStore:00004";
    public const string TreePoolUnavailable = "Knowledtree:TreeStore:00005";
    public const string InvalidTreePoolRates = "Knowledtree:TreeStore:00006";
    public const string InvalidTreePoolDateRange = "Knowledtree:TreeStore:00007";
    public const string TreePoolMissingRarityItems = "Knowledtree:TreeStore:00008";
    public const string UnsupportedTreePoolCurrency = "Knowledtree:TreeStore:00009";
    public const string ActivePlantingSessionAlreadyExists = "Knowledtree:TreeStore:00010";
    public const string InvalidPlantingSessionStatus = "Knowledtree:TreeStore:00011";
    public const string PlantingSessionNotReady = "Knowledtree:TreeStore:00012";
    public const string ReferencedTreeCannotBeDeleted = "Knowledtree:TreeStore:00013";
    public const string ReferencedTreePoolCannotBeDeleted = "Knowledtree:TreeStore:00014";
    public const string TagDoesNotBelongToCurrentUser = "Knowledtree:TreeStore:00015";
    public const string InvalidPlantingDuration = "Knowledtree:TreeStore:00016";

    // Daily missions
    public const string DailyMissionPoolInsufficient = "Knowledtree:DailyMission:00001";
    public const string DailyMissionNotCompleted = "Knowledtree:DailyMission:00002";
    public const string DailyMissionAlreadyClaimed = "Knowledtree:DailyMission:00003";
    public const string DailyMissionNotFound = "Knowledtree:DailyMission:00004";
    public const string InvalidDailyMissionProgress = "Knowledtree:DailyMission:00005";
}
