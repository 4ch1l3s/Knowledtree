using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Knowledtree.Data;
using Volo.Abp.DependencyInjection;

namespace Knowledtree.EntityFrameworkCore;

public class EntityFrameworkCoreKnowledtreeDbSchemaMigrator
    : IKnowledtreeDbSchemaMigrator, ITransientDependency
{
    private readonly IServiceProvider _serviceProvider;

    public EntityFrameworkCoreKnowledtreeDbSchemaMigrator(
        IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public async Task MigrateAsync()
    {
        /* We intentionally resolve the KnowledtreeDbContext
         * from IServiceProvider (instead of directly injecting it)
         * to properly get the connection string of the current tenant in the
         * current scope.
         */

        await _serviceProvider
            .GetRequiredService<KnowledtreeDbContext>()
            .Database
            .MigrateAsync();
    }
}
