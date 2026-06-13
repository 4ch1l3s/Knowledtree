using System;
using System.Threading.Tasks;
using Volo.Abp.Application.Services;

namespace Knowledtree.Users;

public interface IAdminUserBalanceAppService : IApplicationService
{
    Task<AdminUserBalanceDto> GetAsync(Guid userId);

    Task<AdminUserBalanceDto> UpdateWalletAsync(Guid userId, UpdateUserWalletDto input);

    Task<AdminUserBalanceDto> UpsertSeedPackageAsync(Guid userId, UpsertUserSeedPackageDto input);

    Task<AdminUserBalanceDto> DeleteSeedPackageAsync(Guid userId, int treePoolId);
}
