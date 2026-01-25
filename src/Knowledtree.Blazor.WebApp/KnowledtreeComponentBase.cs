using Knowledtree.Localization;
using Volo.Abp.AspNetCore.Components;

namespace Knowledtree.Blazor.WebApp;

public abstract class KnowledtreeComponentBase : AbpComponentBase
{
    protected KnowledtreeComponentBase()
    {
        LocalizationResource = typeof(KnowledtreeResource);
    }
}
