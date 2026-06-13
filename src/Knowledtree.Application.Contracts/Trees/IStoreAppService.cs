using System.Collections.Generic;
using System.Threading.Tasks;
using Volo.Abp.Application.Services;

namespace Knowledtree.Trees;

public interface IStoreAppService : IApplicationService
{
    Task<WalletDto> GetMyWalletAsync();

    Task<List<TreePoolDto>> GetAvailableTreePoolsAsync();

    Task<List<SeedPackageDto>> GetMySeedPackagesAsync();

    Task<BuySeedPackageResultDto> BuySeedPackageAsync(int treePoolId);
}
