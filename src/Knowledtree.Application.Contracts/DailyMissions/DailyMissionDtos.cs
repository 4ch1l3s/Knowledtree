using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Knowledtree.Trees;

namespace Knowledtree.DailyMissions;

[Serializable]
public class DailyMissionDto
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public DailyMissionType MissionType { get; set; }

    public int TargetValue { get; set; }

    public DailyMissionRewardType RewardType { get; set; }

    public int RewardAmount { get; set; }

    public bool IsActive { get; set; }
}

[Serializable]
public class CreateUpdateDailyMissionDto
{
    [Required]
    [StringLength(DailyMissionConsts.MaxNameLength)]
    public string Name { get; set; } = null!;

    [StringLength(DailyMissionConsts.MaxDescriptionLength)]
    public string? Description { get; set; }

    [Required]
    [EnumDataType(typeof(DailyMissionType))]
    public DailyMissionType MissionType { get; set; }

    [Range(1, int.MaxValue)]
    public int TargetValue { get; set; }

    [Required]
    [EnumDataType(typeof(DailyMissionRewardType))]
    public DailyMissionRewardType RewardType { get; set; }

    [Range(1, int.MaxValue)]
    public int RewardAmount { get; set; }

    public bool IsActive { get; set; }
}

[Serializable]
public class UserDailyMissionDto
{
    public Guid Id { get; set; }

    public int? DailyMissionId { get; set; }

    public DateOnly MissionDate { get; set; }

    public int Slot { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public DailyMissionType MissionType { get; set; }

    public int TargetValue { get; set; }

    public DailyMissionRewardType RewardType { get; set; }

    public int RewardAmount { get; set; }

    public int Progress { get; set; }

    public bool IsCompleted { get; set; }

    public bool IsClaimed { get; set; }

    public DateTime? CompletedAt { get; set; }

    public DateTime? ClaimedAt { get; set; }
}

[Serializable]
public class TodayDailyMissionsDto
{
    public DateOnly MissionDate { get; set; }

    public DateTime ResetsAt { get; set; }

    public int CompletedCount { get; set; }

    public int ClaimedCount { get; set; }

    public int TotalCount { get; set; }

    public WalletDto Wallet { get; set; } = null!;

    public List<UserDailyMissionDto> Missions { get; set; } = [];
}

[Serializable]
public class ClaimDailyMissionResultDto
{
    public UserDailyMissionDto Mission { get; set; } = null!;

    public WalletDto Wallet { get; set; } = null!;
}
