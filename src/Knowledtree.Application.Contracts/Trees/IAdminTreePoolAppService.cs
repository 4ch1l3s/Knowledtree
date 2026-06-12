using System.Collections.Generic;
using System.Threading.Tasks;
using Volo.Abp.Application.Services;

namespace Knowledtree.Trees;

public interface IAdminTreePoolAppService : IApplicationService
{
    Task<List<TreePoolDto>> GetListAsync();

    Task<TreePoolDto> GetAsync(int id);

    Task<TreePoolDto> CreateAsync(CreateUpdateTreePoolDto input);

    Task<TreePoolDto> UpdateAsync(int id, CreateUpdateTreePoolDto input);

    Task<TreePoolDto> ReplaceItemsAsync(int id, ReplaceTreePoolItemsDto input);

    Task DeleteAsync(int id);
}
