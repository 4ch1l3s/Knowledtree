using System;
using System.Collections.Generic;
using System.Text;
using Knowledtree.Localization;
using Volo.Abp.Application.Services;

namespace Knowledtree;

/* Inherit your application services from this class.
 */
public abstract class KnowledtreeAppService : ApplicationService
{
    protected KnowledtreeAppService()
    {
        LocalizationResource = typeof(KnowledtreeResource);
    }
}
