using System.Threading.Tasks;
using Shouldly;
using Xunit;

namespace Knowledtree.Pages;

public class TreeManagement_Tests : KnowledtreeWebTestBase
{
    [Fact]
    public async Task Trees_Page()
    {
        var response = await GetResponseAsStringAsync("/TreeManagement/Trees");

        response.ShouldContain("Trees");
    }

    [Fact]
    public async Task TreePools_Page()
    {
        var response = await GetResponseAsStringAsync("/TreeManagement/TreePools");

        response.ShouldContain("Treepools");
    }
}
