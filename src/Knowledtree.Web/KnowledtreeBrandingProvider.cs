using Microsoft.Extensions.Localization;
using Knowledtree.Localization;
using Volo.Abp.Ui.Branding;
using Volo.Abp.DependencyInjection;

namespace Knowledtree.Web;

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
