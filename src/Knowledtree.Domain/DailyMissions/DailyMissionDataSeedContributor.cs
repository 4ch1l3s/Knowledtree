using System.Collections.Generic;
using System.Threading.Tasks;
using Volo.Abp.Data;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Domain.Repositories;

namespace Knowledtree.DailyMissions;

public class DailyMissionDataSeedContributor : IDataSeedContributor, ITransientDependency
{
    private readonly IRepository<DailyMission, int> _dailyMissionRepository;

    public DailyMissionDataSeedContributor(IRepository<DailyMission, int> dailyMissionRepository)
    {
        _dailyMissionRepository = dailyMissionRepository;
    }

    public virtual async Task SeedAsync(DataSeedContext context)
    {
        if (await _dailyMissionRepository.GetCountAsync() > 0)
        {
            return;
        }

        var missions = new List<DailyMission>
        {
            new("Complete 1 focus session", "Finish one focus session today.", DailyMissionType.CompleteFocusSessions, 1, DailyMissionRewardType.Gold, 100, true),
            new("Complete 2 focus sessions", "Finish two focus sessions today.", DailyMissionType.CompleteFocusSessions, 2, DailyMissionRewardType.Gold, 200, true),
            new("Focus for 30 minutes", "Accumulate 30 minutes of completed focus time.", DailyMissionType.FocusMinutes, 30, DailyMissionRewardType.Gold, 120, true),
            new("Focus for 60 minutes", "Accumulate 60 minutes of completed focus time.", DailyMissionType.FocusMinutes, 60, DailyMissionRewardType.Gold, 250, true),
            new("Complete 3 focus sessions", "Finish three focus sessions today.", DailyMissionType.CompleteFocusSessions, 3, DailyMissionRewardType.Gem, 3, true),
            new("Focus for 90 minutes", "Accumulate 90 minutes of completed focus time.", DailyMissionType.FocusMinutes, 90, DailyMissionRewardType.Gem, 5, true)
        };

        await _dailyMissionRepository.InsertManyAsync(missions, autoSave: true);
    }
}
