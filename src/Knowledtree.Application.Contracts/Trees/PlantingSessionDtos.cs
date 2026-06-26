using System;
using System.ComponentModel.DataAnnotations;

namespace Knowledtree.Trees;

[Serializable]
public class StartPlantingSessionDto
{
    [Required]
    public int TreePoolId { get; set; }

    public int? TagId { get; set; }

    [Range(1, int.MaxValue)]
    public int PlannedDurationMinutes { get; set; }

    public DateTime? ClientStartTime { get; set; }
}

[Serializable]
public class CompletePlantingSessionDto
{
    public DateTime? ClientEndTime { get; set; }
}

[Serializable]
public class PlantingSessionDto
{
    public Guid Id { get; set; }

    public int TreePoolId { get; set; }

    public int? ResultTreeId { get; set; }

    public int? TagId { get; set; }

    public int PlannedDurationMinutes { get; set; }

    public DateTime ClientStartTime { get; set; }

    public DateTime ServerStartTime { get; set; }

    public DateTime? ClientEndTime { get; set; }

    public DateTime? ServerEndTime { get; set; }

    public PlantingSessionStatus Status { get; set; }

    public int DuplicateGemReward { get; set; }

    public int DuplicateCoinReward { get; set; }
}

[Serializable]
public class CompletePlantingSessionResultDto
{
    public PlantingSessionDto Session { get; set; } = null!;

    public TreeDto ResultTree { get; set; } = null!;

    public bool IsDuplicate { get; set; }

    public int BonusCoinReward { get; set; }

    public int BonusGemReward { get; set; }

    public int TotalObtainedCount { get; set; }

    public WalletDto Wallet { get; set; } = null!;
}
