using Knowledtree.EntityFrameworkCore;
using Volo.Abp.Autofac;
using Volo.Abp.Modularity;

namespace Knowledtree.DbMigrator;

[DependsOn(
    typeof(AbpAutofacModule),
    typeof(KnowledtreeEntityFrameworkCoreModule),
    typeof(KnowledtreeApplicationContractsModule)
    )]
public class KnowledtreeDbMigratorModule : AbpModule
{
}
