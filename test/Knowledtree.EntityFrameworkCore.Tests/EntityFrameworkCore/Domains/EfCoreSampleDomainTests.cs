using Knowledtree.Samples;
using Xunit;

namespace Knowledtree.EntityFrameworkCore.Domains;

[Collection(KnowledtreeTestConsts.CollectionDefinitionName)]
public class EfCoreSampleDomainTests : SampleDomainTests<KnowledtreeEntityFrameworkCoreTestModule>
{

}
