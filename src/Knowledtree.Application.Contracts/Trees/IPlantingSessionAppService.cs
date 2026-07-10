using System;
using System.Threading.Tasks;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;

namespace Knowledtree.Trees;

public interface IPlantingSessionAppService : IApplicationService
{
    Task<PlantingSessionDto> StartAsync(StartPlantingSessionDto input);

    Task<CompletePlantingSessionResultDto> CompleteAsync(Guid id, CompletePlantingSessionDto input);

    Task<PlantingSessionDto> FailAsync(Guid id, FailPlantingSessionDto input);

    Task<PlantingSessionDto?> GetActiveAsync();

    Task<PagedResultDto<PlantingSessionHistoryItemDto>> GetHistoryAsync(PagedResultRequestDto input);
}
