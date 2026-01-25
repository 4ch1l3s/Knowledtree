using Volo.Abp.Modularity;

namespace Knowledtree;

/* Inherit from this class for your domain layer tests. */
public abstract class KnowledtreeDomainTestBase<TStartupModule> : KnowledtreeTestBase<TStartupModule>
    where TStartupModule : IAbpModule
{

}
