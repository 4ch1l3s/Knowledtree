using System;
using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace Knowledtree.DailyMissions;

public class UserDailyMission : AuditedAggregateRoot<Guid>
{
    public virtual Guid UserId { get; protected set; }

    public virtual int? DailyMissionId { get; protected set; }

    public virtual DateOnly MissionDate { get; protected set; }

    public virtual int Slot { get; protected set; }

    public virtual string MissionName { get; protected set; } = null!;

    public virtual string? MissionDescription { get; protected set; }

    public virtual DailyMissionType MissionType { get; protected set; }

    public virtual int TargetValue { get; protected set; }

    public virtual DailyMissionRewardType RewardType { get; protected set; }

    public virtual int RewardAmount { get; protected set; }

    public virtual int Progress { get; protected set; }

    public virtual bool IsCompleted { get; protected set; }

    public virtual bool IsClaimed { get; protected set; }

    public virtual DateTime? CompletedAt { get; protected set; }

    public virtual DateTime? ClaimedAt { get; protected set; }

    protected UserDailyMission()
    {
    }

    public UserDailyMission(
        Guid id,
        Guid userId,
        DailyMission dailyMission,
        DateOnly missionDate,
        int slot)
        : base(id)
    {
        UserId = userId;
        DailyMissionId = dailyMission.Id;
        MissionDate = missionDate;
        Slot = Check.Range(slot, nameof(slot), 1, DailyMissionConsts.MissionsPerDay);
        MissionName = dailyMission.Name;
        MissionDescription = dailyMission.Description;
        MissionType = dailyMission.MissionType;
        TargetValue = dailyMission.TargetValue;
        RewardType = dailyMission.RewardType;
        RewardAmount = dailyMission.RewardAmount;
    }

    public virtual void SetProgress(int progress, DateTime now)
    {
        if (progress < 0)
        {
            throw new BusinessException(KnowledtreeDomainErrorCodes.InvalidDailyMissionProgress);
        }

        Progress = Math.Min(progress, TargetValue);
        if (Progress >= TargetValue && !IsCompleted)
        {
            IsCompleted = true;
            CompletedAt = now;
        }
    }

    public virtual void Claim(DateTime now)
    {
        if (!IsCompleted)
        {
            throw new BusinessException(KnowledtreeDomainErrorCodes.DailyMissionNotCompleted);
        }

        if (IsClaimed)
        {
            throw new BusinessException(KnowledtreeDomainErrorCodes.DailyMissionAlreadyClaimed);
        }

        IsClaimed = true;
        ClaimedAt = now;
    }
}
