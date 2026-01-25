using Knowledtree.Localization;
using Volo.Abp.AspNetCore.Mvc.UI.RazorPages;

namespace Knowledtree.Web.Pages;

/* Inherit your PageModel classes from this class.
 */
public abstract class KnowledtreePageModel : AbpPageModel
{
    protected KnowledtreePageModel()
    {
        LocalizationResourceType = typeof(KnowledtreeResource);
    }
}
