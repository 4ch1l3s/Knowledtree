using System.Collections.Generic;
using System.Threading.Tasks;
using Volo.Abp.Application.Services;

namespace Knowledtree.Trees;

public interface IAdminTreeAppService : IApplicationService
{
    Task<List<TreeDto>> GetListAsync();

    Task<TreeDto> GetAsync(int id);

    Task<TreeDto> CreateAsync(CreateUpdateTreeDto input);

    Task<TreeDto> UpdateAsync(int id, CreateUpdateTreeDto input);

    Task DeleteAsync(int id);
}
