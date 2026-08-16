using System.Collections.Generic;
using System.Threading.Tasks;
using Volo.Abp.Application.Services;

namespace Knowledtree.DailyMissions;

public interface IAdminDailyMissionAppService : IApplicationService
{
    Task<List<DailyMissionDto>> GetListAsync();

    Task<DailyMissionDto> GetAsync(int id);

    Task<DailyMissionDto> CreateAsync(CreateUpdateDailyMissionDto input);

    Task<DailyMissionDto> UpdateAsync(int id, CreateUpdateDailyMissionDto input);

    Task DeleteAsync(int id);
}
