using Volo.Abp.Modularity;

namespace Knowledtree;

public abstract class KnowledtreeApplicationTestBase<TStartupModule> : KnowledtreeTestBase<TStartupModule>
    where TStartupModule : IAbpModule
{

}
