using System;
using System.Threading.Tasks;
using Volo.Abp.Application.Services;

namespace Knowledtree.Trees;

public interface IPlantingSessionAppService : IApplicationService
{
    Task<PlantingSessionDto> StartAsync(StartPlantingSessionDto input);

    Task<CompletePlantingSessionResultDto> CompleteAsync(Guid id, CompletePlantingSessionDto input);
}
