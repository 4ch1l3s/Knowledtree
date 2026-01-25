using Microsoft.AspNetCore.Builder;
using Knowledtree;
using Volo.Abp.AspNetCore.TestBase;

var builder = WebApplication.CreateBuilder();

builder.Environment.ContentRootPath = GetWebProjectContentRootPathHelper.Get("Knowledtree.Web.csproj");
await builder.RunAbpModuleAsync<KnowledtreeWebTestModule>(applicationName: "Knowledtree.Web" );

public partial class Program
{
}
