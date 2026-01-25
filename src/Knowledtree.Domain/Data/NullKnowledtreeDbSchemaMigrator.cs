using System.Threading.Tasks;
using Volo.Abp.DependencyInjection;

namespace Knowledtree.Data;

/* This is used if database provider does't define
 * IKnowledtreeDbSchemaMigrator implementation.
 */
public class NullKnowledtreeDbSchemaMigrator : IKnowledtreeDbSchemaMigrator, ITransientDependency
{
    public Task MigrateAsync()
    {
        return Task.CompletedTask;
    }
}
