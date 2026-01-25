using Volo.Abp.Modularity;

namespace Knowledtree;

[DependsOn(
    typeof(KnowledtreeDomainModule),
    typeof(KnowledtreeTestBaseModule)
)]
public class KnowledtreeDomainTestModule : AbpModule
{

}
