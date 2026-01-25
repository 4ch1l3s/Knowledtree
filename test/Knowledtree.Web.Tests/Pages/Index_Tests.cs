using System.Threading.Tasks;
using Shouldly;
using Xunit;

namespace Knowledtree.Pages;

public class Index_Tests : KnowledtreeWebTestBase
{
    [Fact]
    public async Task Welcome_Page()
    {
        var response = await GetResponseAsStringAsync("/");
        response.ShouldNotBeNull();
    }
}
