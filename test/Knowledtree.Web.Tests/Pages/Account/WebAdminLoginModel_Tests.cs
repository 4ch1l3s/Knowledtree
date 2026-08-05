using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Shouldly;
using Volo.Abp.Account.Web.Pages.Account;
using Xunit;

namespace Knowledtree.Web.Pages.Account;

public class WebAdminLoginModel_Tests : KnowledtreeWebTestBase
{
    [Theory]
    [InlineData("admin")]
    [InlineData("ADMIN")]
    public void Admin_role_should_have_web_access(string roleName)
    {
        WebAdminLoginAccessPolicy.HasAccess([roleName]).ShouldBeTrue();
    }

    [Fact]
    public void Regular_mobile_role_should_not_have_web_access()
    {
        WebAdminLoginAccessPolicy.HasAccess(["user"]).ShouldBeFalse();
    }

    [Fact]
    public void Login_page_should_resolve_the_admin_gate_model()
    {
        GetRequiredService<LoginModel>().ShouldBeOfType<WebAdminLoginModel>();
    }

    [Fact]
    public async Task Login_page_should_render_with_the_admin_gate_model()
    {
        var response = await GetResponseAsStringAsync("/Account/Login");

        response.ShouldContain("Login");
    }
}
