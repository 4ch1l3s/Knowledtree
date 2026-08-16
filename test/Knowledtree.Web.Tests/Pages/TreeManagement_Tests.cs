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

    [Fact]
    public async Task DailyMissions_Page()
    {
        var response = await GetResponseAsStringAsync("/DailyMissions");

        response.ShouldContain("Daily Missions");
        response.ShouldContain("Complete 1 focus session");
    }
}
