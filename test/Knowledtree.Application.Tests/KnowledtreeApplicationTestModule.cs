using Volo.Abp.Modularity;

namespace Knowledtree;

[DependsOn(
    typeof(KnowledtreeApplicationModule),
    typeof(KnowledtreeDomainTestModule)
)]
public class KnowledtreeApplicationTestModule : AbpModule
{

}
