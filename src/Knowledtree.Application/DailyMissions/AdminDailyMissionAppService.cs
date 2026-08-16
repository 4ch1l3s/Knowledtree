using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Knowledtree.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp.Domain.Repositories;

namespace Knowledtree.DailyMissions;

[Authorize(KnowledtreePermissions.DailyMissions.Default)]
public class AdminDailyMissionAppService : KnowledtreeAppService, IAdminDailyMissionAppService
{
    private readonly IRepository<DailyMission, int> _dailyMissionRepository;

    public AdminDailyMissionAppService(IRepository<DailyMission, int> dailyMissionRepository)
    {
        _dailyMissionRepository = dailyMissionRepository;
    }

    public virtual async Task<List<DailyMissionDto>> GetListAsync()
    {
        var missions = await AsyncExecuter.ToListAsync(
            (await _dailyMissionRepository.GetQueryableAsync())
            .OrderByDescending(x => x.IsActive)
            .ThenBy(x => x.RewardType)
            .ThenBy(x => x.Id));

        return missions.Select(MapMission).ToList();
    }

    public virtual async Task<DailyMissionDto> GetAsync(int id)
    {
        return MapMission(await _dailyMissionRepository.GetAsync(id));
    }

    [Authorize(KnowledtreePermissions.DailyMissions.Create)]
    public virtual async Task<DailyMissionDto> CreateAsync(CreateUpdateDailyMissionDto input)
    {
        var mission = new DailyMission(
            input.Name,
            input.Description,
            input.MissionType,
            input.TargetValue,
            input.RewardType,
            input.RewardAmount,
            input.IsActive);

        await _dailyMissionRepository.InsertAsync(mission, autoSave: true);
        return MapMission(mission);
    }

    [Authorize(KnowledtreePermissions.DailyMissions.Update)]
    public virtual async Task<DailyMissionDto> UpdateAsync(int id, CreateUpdateDailyMissionDto input)
    {
        var mission = await _dailyMissionRepository.GetAsync(id);
        mission.Update(
            input.Name,
            input.Description,
            input.MissionType,
            input.TargetValue,
            input.RewardType,
            input.RewardAmount,
            input.IsActive);

        await _dailyMissionRepository.UpdateAsync(mission, autoSave: true);
        return MapMission(mission);
    }

    [Authorize(KnowledtreePermissions.DailyMissions.Delete)]
    public virtual async Task DeleteAsync(int id)
    {
        await _dailyMissionRepository.DeleteAsync(id, autoSave: true);
    }

    private static DailyMissionDto MapMission(DailyMission mission)
    {
        return new DailyMissionDto
        {
            Id = mission.Id,
            Name = mission.Name,
            Description = mission.Description,
            MissionType = mission.MissionType,
            TargetValue = mission.TargetValue,
            RewardType = mission.RewardType,
            RewardAmount = mission.RewardAmount,
            IsActive = mission.IsActive
        };
    }
}
