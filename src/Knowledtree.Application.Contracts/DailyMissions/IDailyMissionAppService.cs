using System;
using System.Threading.Tasks;
using Volo.Abp.Application.Services;

namespace Knowledtree.DailyMissions;

public interface IDailyMissionAppService : IApplicationService
{
    Task<TodayDailyMissionsDto> GetTodayAsync();

    Task<ClaimDailyMissionResultDto> ClaimAsync(Guid id);
}
