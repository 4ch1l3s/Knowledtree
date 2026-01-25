using Knowledtree.Samples;
using Xunit;

namespace Knowledtree.EntityFrameworkCore.Applications;

[Collection(KnowledtreeTestConsts.CollectionDefinitionName)]
public class EfCoreSampleAppServiceTests : SampleAppServiceTests<KnowledtreeEntityFrameworkCoreTestModule>
{

}
