using Microsoft.Extensions.Localization;
using Knowledtree.Localization;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Ui.Branding;

namespace Knowledtree.Blazor.WebApp.Client;

[Dependency(ReplaceServices = true)]
public class KnowledtreeBrandingProvider : DefaultBrandingProvider
{
    private IStringLocalizer<KnowledtreeResource> _localizer;

    public KnowledtreeBrandingProvider(IStringLocalizer<KnowledtreeResource> localizer)
    {
        _localizer = localizer;
    }

    public override string AppName => _localizer["AppName"];
}
