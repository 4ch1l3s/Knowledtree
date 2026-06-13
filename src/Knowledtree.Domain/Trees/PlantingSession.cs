using System;
using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace Knowledtree.Trees;

public class PlantingSession : AuditedAggregateRoot<Guid>
{
    public virtual Guid UserId { get; protected set; }

    public virtual int TreePoolId { get; protected set; }

    public virtual int? ResultTreeId { get; protected set; }

    public virtual int? TagId { get; protected set; }

    public virtual int PlannedDurationMinutes { get; protected set; }

    public virtual DateTime ClientStartTime { get; protected set; }

    public virtual DateTime ServerStartTime { get; protected set; }

    public virtual DateTime? ClientEndTime { get; protected set; }

    public virtual DateTime? ServerEndTime { get; protected set; }

    public virtual PlantingSessionStatus Status { get; protected set; }

    public virtual int DuplicateGemReward { get; protected set; }

    protected PlantingSession()
    {
    }

    public PlantingSession(
        Guid id,
        Guid userId,
        int treePoolId,
        int? tagId,
        int plannedDurationMinutes,
        DateTime clientStartTime,
        DateTime serverStartTime)
        : base(id)
    {
        UserId = userId;
        TreePoolId = treePoolId;
        TagId = tagId;
        PlannedDurationMinutes = plannedDurationMinutes;
        ClientStartTime = clientStartTime;
        ServerStartTime = serverStartTime;
        Status = PlantingSessionStatus.Growing;
    }

    public virtual void Complete(
        int resultTreeId,
        DateTime? clientEndTime,
        DateTime serverEndTime,
        int duplicateGemReward)
    {
        if (Status != PlantingSessionStatus.Growing)
        {
            throw new BusinessException(KnowledtreeDomainErrorCodes.InvalidPlantingSessionStatus);
        }

        ResultTreeId = resultTreeId;
        ClientEndTime = clientEndTime;
        ServerEndTime = serverEndTime;
        DuplicateGemReward = duplicateGemReward;
        Status = PlantingSessionStatus.Claimed;
    }

    public virtual void Cancel()
    {
        if (Status != PlantingSessionStatus.Growing)
        {
            throw new BusinessException(KnowledtreeDomainErrorCodes.InvalidPlantingSessionStatus);
        }

        Status = PlantingSessionStatus.Cancelled;
    }
}
