using Knowledtree.Localization;
using Volo.Abp.AspNetCore.Mvc;

namespace Knowledtree.Controllers;

/* Inherit your controllers from this class.
 */
public abstract class KnowledtreeController : AbpControllerBase
{
    protected KnowledtreeController()
    {
        LocalizationResource = typeof(KnowledtreeResource);
    }
}
