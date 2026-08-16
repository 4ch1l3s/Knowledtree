using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace Knowledtree.DailyMissions;

public class DailyMission : AuditedAggregateRoot<int>
{
    public virtual string Name { get; protected set; } = null!;

    public virtual string? Description { get; protected set; }

    public virtual DailyMissionType MissionType { get; protected set; }

    public virtual int TargetValue { get; protected set; }

    public virtual DailyMissionRewardType RewardType { get; protected set; }

    public virtual int RewardAmount { get; protected set; }

    public virtual bool IsActive { get; protected set; }

    protected DailyMission()
    {
    }

    public DailyMission(
        string name,
        string? description,
        DailyMissionType missionType,
        int targetValue,
        DailyMissionRewardType rewardType,
        int rewardAmount,
        bool isActive)
    {
        SetValues(name, description, missionType, targetValue, rewardType, rewardAmount, isActive);
    }

    public virtual void Update(
        string name,
        string? description,
        DailyMissionType missionType,
        int targetValue,
        DailyMissionRewardType rewardType,
        int rewardAmount,
        bool isActive)
    {
        SetValues(name, description, missionType, targetValue, rewardType, rewardAmount, isActive);
    }

    private void SetValues(
        string name,
        string? description,
        DailyMissionType missionType,
        int targetValue,
        DailyMissionRewardType rewardType,
        int rewardAmount,
        bool isActive)
    {
        Name = Check.NotNullOrWhiteSpace(name, nameof(name), DailyMissionConsts.MaxNameLength);
        Description = description?.Trim();
        MissionType = missionType;
        TargetValue = Check.Range(targetValue, nameof(targetValue), 1, int.MaxValue);
        RewardType = rewardType;
        RewardAmount = Check.Range(rewardAmount, nameof(rewardAmount), 1, int.MaxValue);
        IsActive = isActive;
    }
}
