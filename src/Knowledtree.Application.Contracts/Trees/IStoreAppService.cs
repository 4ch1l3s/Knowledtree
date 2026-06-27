using System.Collections.Generic;
using System.Threading.Tasks;
using Volo.Abp.Application.Services;

namespace Knowledtree.Trees;

public interface IStoreAppService : IApplicationService
{
    Task<WalletDto> GetMyWalletAsync();

    Task<List<TreePoolDto>> GetAvailableTreePoolsAsync();

    Task<List<SeedPackageDto>> GetMySeedPackagesAsync();

    Task<List<OwnedTreeDto>> GetMyTreesAsync();

    Task<BuySeedPackageResultDto> BuySeedPackageAsync(int treePoolId);

    Task<BuySeedPackagesResultDto> BuySeedPackagesAsync(BuySeedPackagesDto input);
}
