using Knowledtree.DailyMissions;

namespace Knowledtree.Web.Pages.DailyMissions;

public class DailyMissionFormViewModel
{
    public string Prefix { get; set; } = null!;

    public DailyMissionDto? Mission { get; set; }

    public CreateUpdateDailyMissionDto? Input { get; set; }

    public DailyMissionType[] MissionTypes { get; set; } = [];

    public DailyMissionRewardType[] RewardTypes { get; set; } = [];

    public string? Name => Input?.Name ?? Mission?.Name;

    public string? Description => Input?.Description ?? Mission?.Description;

    public DailyMissionType MissionType => Input?.MissionType ?? Mission?.MissionType ?? DailyMissionType.CompleteFocusSessions;

    public int TargetValue => Input?.TargetValue ?? Mission?.TargetValue ?? 1;

    public DailyMissionRewardType RewardType => Input?.RewardType ?? Mission?.RewardType ?? DailyMissionRewardType.Gold;

    public int RewardAmount => Input?.RewardAmount ?? Mission?.RewardAmount ?? 100;

    public bool IsActive => Input?.IsActive ?? Mission?.IsActive ?? true;
}
